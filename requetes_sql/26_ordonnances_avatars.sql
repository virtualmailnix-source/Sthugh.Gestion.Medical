-- ============================================================
--  26_ordonnances_avatars.sql
--  St Hugh's Anglican Home - Ordonnances privées + photo de
--  profil des utilisateurs
--
--  1. Bucket ordonnances : privé (10 Mo, pdf/jpeg/png/webp),
--     lecture ET écriture réservées au staff médical - la
--     réceptionniste n'a pas accès au volet médical.
--  2. consultations.ordonnance_url : URL publique -> chemin du
--     fichier (le front signe à la volée, comme les photos).
--  3. app_users.photo_url : photo de profil, modifiable par
--     chacun pour SON compte via fn_update_my_photo (la RLS
--     app_users_modify reste réservée au super admin ; la RPC
--     ne touche que photo_url de sa propre ligne).
--     Fichiers rangés sous users/ dans le bucket photos-residents
--     (politiques fn_is_app_user du SQL 25 : déjà correctes).
--
--  NOTE storage : jamais d'ALTER TABLE sur storage.objects ;
--  uniquement du DML sur storage.buckets et des CREATE POLICY.
--
--  À exécuter APRÈS 25_photos_privees.sql.
-- ============================================================

-- ── 1. Bucket ordonnances privé ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ordonnances', 'ordonnances', FALSE, 10485760,
        ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
   SET public             = FALSE,
       file_size_limit    = 10485760,
       allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp'];

-- Nettoyage générique : toute politique visant ce bucket disparaît,
-- y compris celles créées à la main dans le Dashboard.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual, '') LIKE '%ordonnances%'
        OR COALESCE(with_check, '') LIKE '%ordonnances%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "ordonnances_read_medical" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ordonnances' AND fn_is_medical_staff());

CREATE POLICY "ordonnances_upload_medical" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ordonnances' AND fn_is_medical_staff());

CREATE POLICY "ordonnances_update_medical" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ordonnances' AND fn_is_medical_staff());

CREATE POLICY "ordonnances_delete_medical" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ordonnances' AND fn_is_medical_staff());

-- ── 2. Migration : URL publique -> chemin dans le bucket ─────
UPDATE consultations
   SET ordonnance_url = regexp_replace(ordonnance_url,
        '^https?://[^/]+/storage/v1/object/(public|sign)/ordonnances/', '')
 WHERE ordonnance_url ~ '^https?://[^/]+/storage/v1/object/(public|sign)/ordonnances/';

-- ── 3. Photo de profil des utilisateurs ──────────────────────
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Chacun met à jour SA photo, et rien d'autre : SECURITY DEFINER
-- contourne app_users_modify (super admin only) mais la fonction
-- verrouille la ligne (auth.uid()) et la colonne (photo_url seule).
-- Le trigger d'audit générique journalise le changement.
CREATE OR REPLACE FUNCTION fn_update_my_photo(p_path TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT fn_is_app_user() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  -- NULL ou chaîne vide : retrait de la photo. Sinon le chemin doit
  -- rester dans le dossier users/ du bucket (jamais une URL, jamais
  -- le dossier des résidents).
  IF NULLIF(TRIM(p_path), '') IS NOT NULL AND TRIM(p_path) !~ '^users/[^/]+$' THEN
    RAISE EXCEPTION 'Chemin de photo invalide';
  END IF;
  UPDATE app_users
     SET photo_url = NULLIF(TRIM(p_path), '')
   WHERE auth_user_id = auth.uid();
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_update_my_photo(TEXT) TO authenticated;

-- ── 4. Contrôle ───────────────────────────────────────────────
-- Attendu : les deux buckets privés, plus aucune URL http stockée.
SELECT
  (SELECT public FROM storage.buckets WHERE id = 'photos-residents') AS photos_public,
  (SELECT public FROM storage.buckets WHERE id = 'ordonnances')      AS ordonnances_public,
  (SELECT COUNT(*) FROM consultations WHERE ordonnance_url ~ '^https?://') AS ordo_urls_restantes,
  (SELECT COUNT(*) FROM residents     WHERE photo_url ~ '^https?://')      AS photos_urls_restantes;
