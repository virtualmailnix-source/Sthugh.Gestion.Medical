-- ============================================================
--  25_photos_privees.sql
--  St Hugh's Anglican Home - Photos résidents : bucket privé
--  + compléments du panel d'administration intégré
--
--  1. Bucket photos-residents : privé, 5 Mo max, jpeg/png/webp
--     (créé s'il manque, resserré s'il existe déjà).
--  2. Politiques storage réservées aux utilisateurs actifs de
--     l'app (avant : lecture publique mondiale, écriture pour
--     tout compte authentifié même hors app_users).
--  3. residents.photo_url : URL publique figée -> chemin du
--     fichier dans le bucket. Le front génère des URLs signées
--     à la volée ; plus aucune URL permanente en base.
--  4. fn_last_activity() : dernière action de chaque utilisateur
--     (colonne « Dernière activité » du panel d'administration).
--  5. fn_log_evenement : EXPORT_CSV ajouté aux événements permis
--     (export du journal depuis le panel).
--
--  NOTE storage (restrictions Supabase) : jamais d'ALTER TABLE
--  ni d'ENABLE ROW LEVEL SECURITY sur storage.objects (« must be
--  owner of table objects »). RLS y est déjà active ; on ne fait
--  que du DML sur storage.buckets et des CREATE POLICY.
--
--  À exécuter APRÈS 24_demandes_visite.sql.
-- ============================================================

-- ── 1. Bucket privé ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos-residents', 'photos-residents', FALSE, 5242880,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
   SET public             = FALSE,
       file_size_limit    = 5242880,
       allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- ── 2. Politiques : utilisateurs actifs de l'app uniquement ──
-- La réceptionniste gère l'identité des résidents : elle garde
-- l'accès photos, comme le staff médical (fn_is_app_user).
-- Nettoyage GÉNÉRIQUE d'abord : supprime toute politique visant ce
-- bucket, y compris celles créées à la main dans le Dashboard avec
-- des noms inconnus (le SQL 10 suggérait cette voie en secours).
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual, '') LIKE '%photos-residents%'
        OR COALESCE(with_check, '') LIKE '%photos-residents%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "photos_read_app" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'photos-residents' AND fn_is_app_user());

CREATE POLICY "photos_upload_app" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos-residents' AND fn_is_app_user());

CREATE POLICY "photos_update_app" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'photos-residents' AND fn_is_app_user());

CREATE POLICY "photos_delete_app" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos-residents' AND fn_is_app_user());

-- ── 3. Migration : URL publique -> chemin dans le bucket ─────
-- Idempotent : ne touche que les valeurs encore au format URL.
-- Les URLs étrangères au bucket (si jamais) restent intactes.
UPDATE residents
   SET photo_url = regexp_replace(photo_url,
        '^https?://[^/]+/storage/v1/object/(public|sign)/photos-residents/', '')
 WHERE photo_url ~ '^https?://[^/]+/storage/v1/object/(public|sign)/photos-residents/';

-- ── 4. Dernière activité par utilisateur (panel admin) ───────
-- Toutes actions confondues (tables métier + connexions).
CREATE OR REPLACE FUNCTION fn_last_activity()
RETURNS TABLE (auth_user_id UUID, last_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT a.auth_user_id, MAX(a.created_at)
  FROM audit_log a
  WHERE fn_is_super_admin()
    AND a.auth_user_id IS NOT NULL
  GROUP BY a.auth_user_id;
$$;

GRANT EXECUTE ON FUNCTION fn_last_activity() TO authenticated;

-- ── 5. fn_log_evenement : + EXPORT_CSV ───────────────────────
-- Identique au SQL 23, seule la liste blanche change.
CREATE OR REPLACE FUNCTION fn_log_evenement(p_action TEXT, p_details JSONB DEFAULT '{}'::jsonb)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth_uid UUID;
BEGIN
  IF p_action NOT IN ('LOGIN','LOGIN_FAILED','LOGOUT','EXPORT_PDF','EXPORT_CSV') THEN
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

-- ── 6. Contrôle ───────────────────────────────────────────────
-- Attendu : public = false ; photos_migrees = 0 une fois le
-- front livré (plus aucune photo_url au format URL http).
SELECT b.public   AS bucket_public,
       (SELECT COUNT(*) FROM residents WHERE photo_url ~ '^https?://') AS urls_restantes,
       (SELECT COUNT(*) FROM residents WHERE photo_url IS NOT NULL)    AS photos_total
FROM storage.buckets b
WHERE b.id = 'photos-residents';
