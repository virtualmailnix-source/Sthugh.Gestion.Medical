-- ============================================================
--  23_audit_global.sql
--  St Hugh's Anglican Home — Journal d'activité : traçabilité totale
--
--  1. Trigger d'audit générique amélioré :
--     - UPDATE : ne stocke que le diff (champs réellement modifiés)
--     - auteur : auth.uid(), avec fallback app.current_user_id
--       (set_config) pour les écritures via Edge Function en
--       service role. Refus des écritures sans auteur identifiable.
--  2. Attaché à TOUTES les tables du schéma public (bloc DO),
--     sauf la table d'audit elle-même.
--  3. Append-only : REVOKE UPDATE/DELETE + trigger bloquant.
--  4. Lecture réservée au Super Admin (RLS respectée par la vue).
--  5. Événements hors tables : connexions, déconnexions, exports PDF.
--
--  À exécuter APRÈS 22_rdv_consultations.sql.
-- ============================================================

-- ── 0. Élargir la colonne action (LOGIN_FAILED > 10 caractères) ──
ALTER TABLE audit_log ALTER COLUMN action TYPE VARCHAR(20);

-- ── 1. Fonction trigger générique avec diff ──────────────────
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid  UUID;
  v_record_id UUID;
  v_old       JSONB;
  v_new       JSONB;
  v_diff_old  JSONB := '{}'::jsonb;
  v_diff_new  JSONB := '{}'::jsonb;
  v_key       TEXT;
BEGIN
  -- Auteur : JWT Supabase, puis fallback posé par les Edge Functions
  -- (SELECT set_config('app.current_user_id', '<uuid>', true))
  BEGIN
    v_auth_uid := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_auth_uid := NULL;
  END;
  IF v_auth_uid IS NULL THEN
    BEGIN
      v_auth_uid := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_auth_uid := NULL;
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_record_id := CASE WHEN v_old ? 'id' THEN (v_old->>'id')::uuid ELSE NULL END;
    INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
    VALUES (v_auth_uid, 'DELETE', TG_TABLE_NAME, v_record_id,
            jsonb_build_object('old', v_old));
    RETURN OLD;

  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_record_id := CASE WHEN v_new ? 'id' THEN (v_new->>'id')::uuid ELSE NULL END;
    INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
    VALUES (v_auth_uid, 'INSERT', TG_TABLE_NAME, v_record_id,
            jsonb_build_object('new', v_new));
    RETURN NEW;

  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_record_id := CASE WHEN v_new ? 'id' THEN (v_new->>'id')::uuid ELSE NULL END;

    -- Diff : ne conserver que les champs réellement modifiés
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_old->v_key IS DISTINCT FROM v_new->v_key THEN
        v_diff_old := v_diff_old || jsonb_build_object(v_key, v_old->v_key);
        v_diff_new := v_diff_new || jsonb_build_object(v_key, v_new->v_key);
      END IF;
    END LOOP;

    -- UPDATE sans changement réel : ne pas polluer le journal
    IF v_diff_new = '{}'::jsonb THEN
      RETURN NEW;
    END IF;

    INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
    VALUES (v_auth_uid, 'UPDATE', TG_TABLE_NAME, v_record_id,
            jsonb_build_object('old', v_diff_old, 'new', v_diff_new));
    RETURN NEW;
  END IF;
END;
$$;

-- ── 2. Attacher l'audit à TOUTES les tables du schéma public ─
-- Couvre les tables existantes ET celles ajoutées ensuite :
-- ré-exécuter ce bloc après toute création de table (idempotent).
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> 'audit_log'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I', t.table_name, t.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%I
         AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger()',
      t.table_name, t.table_name
    );
  END LOOP;
END;
$$;

-- ── 3. Append-only : le journal ne se modifie ni ne s'efface ─
REVOKE UPDATE, DELETE ON audit_log FROM authenticated, anon;

CREATE OR REPLACE FUNCTION fn_audit_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Le journal d''audit est en lecture seule (append-only)';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_log;
CREATE TRIGGER trg_audit_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_immutable();

-- ── 4. Lecture réservée au Super Admin ───────────────────────
-- La vue doit respecter la RLS de audit_log (policy audit_read,
-- fn_is_super_admin) : sans security_invoker elle s'exécute avec
-- les droits de son propriétaire et contourne la restriction.
ALTER VIEW v_audit_log SET (security_invoker = on);

-- ── 5. Événements hors tables ────────────────────────────────
-- Connexions (réussies/échouées), déconnexions, exports PDF.
-- table_name = '_evenements' pour les distinguer des tables métier.
CREATE OR REPLACE FUNCTION fn_log_evenement(p_action TEXT, p_details JSONB DEFAULT '{}'::jsonb)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth_uid UUID;
BEGIN
  IF p_action NOT IN ('LOGIN','LOGIN_FAILED','LOGOUT','EXPORT_PDF') THEN
    RAISE EXCEPTION 'Type d''événement non autorisé';
  END IF;

  BEGIN
    v_auth_uid := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_auth_uid := NULL;
  END;

  -- Seul LOGIN_FAILED peut être anonyme (l'échec précède l'authentification) ;
  -- l'email tenté est alors conservé dans les détails.
  IF v_auth_uid IS NULL AND p_action <> 'LOGIN_FAILED' THEN
    RAISE EXCEPTION 'Événement non authentifié refusé';
  END IF;

  INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
  VALUES (v_auth_uid, p_action, '_evenements', NULL, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION fn_log_evenement(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_log_evenement(TEXT, JSONB) TO anon;   -- LOGIN_FAILED uniquement

-- ── 6. Tables présentes dans le journal (filtre dynamique du panel) ──
CREATE OR REPLACE FUNCTION fn_audit_tables()
RETURNS TABLE (table_name VARCHAR)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT DISTINCT a.table_name
  FROM audit_log a
  WHERE fn_is_super_admin()
  ORDER BY a.table_name;
$$;

GRANT EXECUTE ON FUNCTION fn_audit_tables() TO authenticated;
