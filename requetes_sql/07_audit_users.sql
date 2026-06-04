-- ============================================================
--  07 — Journal d'audit + mise à jour app_users
--  Exécuter en 7e dans Supabase SQL Editor
--  1. Colonnes email, telephone, poste dans app_users
--  2. Table audit_log (qui fait quoi, quand)
--  3. Vue v_audit_log (avec noms des utilisateurs)
--  4. Fonction + triggers d'audit sur les tables clés
-- ============================================================

-- ============================================================
-- 1. Mise à jour de la table app_users
-- ============================================================
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email      VARCHAR(255);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS telephone  VARCHAR(30);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS poste      VARCHAR(100);

-- ============================================================
-- 2. Table audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id  UUID,                              -- = auth.users.id de l'utilisateur
  action        VARCHAR(10) NOT NULL,              -- INSERT | UPDATE | DELETE
  table_name    VARCHAR(100) NOT NULL,
  record_id     UUID,
  details       JSONB,                             -- snapshot old/new de la ligne
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table   ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Lecture uniquement par le super_admin
-- Les INSERTs se font via la fonction SECURITY DEFINER (bypass RLS)
CREATE POLICY "audit_read"
  ON audit_log FOR SELECT TO authenticated
  USING (fn_is_super_admin());

-- ============================================================
-- 3. Vue v_audit_log (avec noms des utilisateurs)
-- ============================================================
DROP VIEW IF EXISTS v_audit_log;

CREATE VIEW v_audit_log AS
SELECT
  a.id,
  a.action,
  a.table_name,
  a.record_id,
  a.details,
  a.created_at,
  a.auth_user_id,
  u.nom        AS user_nom,
  u.prenom     AS user_prenom,
  u.role       AS user_role,
  u.email      AS user_email,
  u.poste      AS user_poste
FROM audit_log a
LEFT JOIN app_users u ON u.auth_user_id = a.auth_user_id;

-- ============================================================
-- 4. Fonction trigger d'audit
-- ============================================================
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid  UUID;
  v_record_id UUID;
  v_details   JSONB;
BEGIN
  -- Récupère l'utilisateur depuis le JWT Supabase
  BEGIN
    v_auth_uid := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_auth_uid := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_details   := jsonb_build_object('old', to_jsonb(OLD));
    INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
    VALUES (v_auth_uid, 'DELETE', TG_TABLE_NAME, v_record_id, v_details);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id;
    v_details   := jsonb_build_object('new', to_jsonb(NEW));
    INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
    VALUES (v_auth_uid, 'INSERT', TG_TABLE_NAME, v_record_id, v_details);
    RETURN NEW;
  ELSE
    v_record_id := NEW.id;
    v_details   := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    INSERT INTO audit_log (auth_user_id, action, table_name, record_id, details)
    VALUES (v_auth_uid, 'UPDATE', TG_TABLE_NAME, v_record_id, v_details);
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================
-- 5. Triggers sur les tables importantes
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_residents     ON residents;
DROP TRIGGER IF EXISTS trg_audit_doctors       ON doctors;
DROP TRIGGER IF EXISTS trg_audit_traitements   ON traitements;
DROP TRIGGER IF EXISTS trg_audit_consultations ON consultations;
DROP TRIGGER IF EXISTS trg_audit_rdv           ON rendez_vous;
DROP TRIGGER IF EXISTS trg_audit_planning      ON planning_visites;
DROP TRIGGER IF EXISTS trg_audit_app_users     ON app_users;

CREATE TRIGGER trg_audit_residents
  AFTER INSERT OR UPDATE OR DELETE ON residents
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_doctors
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_traitements
  AFTER INSERT OR UPDATE OR DELETE ON traitements
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_consultations
  AFTER INSERT OR UPDATE OR DELETE ON consultations
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_rdv
  AFTER INSERT OR UPDATE OR DELETE ON rendez_vous
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_planning
  AFTER INSERT OR UPDATE OR DELETE ON planning_visites
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_app_users
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
