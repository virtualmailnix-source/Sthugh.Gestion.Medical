-- ============================================================
--  10_departs_visites.sql
--  1. Colonnes sorties/décès sur residents
--  2. Table visites (gestion des visites familles)
--  3. Politiques Storage pour photos-residents
--  À exécuter dans Supabase SQL Editor (10e fichier)
-- ============================================================

-- ============================================================
-- 1. Colonnes départs / décès dans residents
-- ============================================================
ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS statut_depart VARCHAR(20) DEFAULT NULL
    CHECK (statut_depart IS NULL OR statut_depart IN ('vacances','depart','deces')),
  ADD COLUMN IF NOT EXISTS date_sortie       TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_retour_prevue DATE        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS motif_sortie      TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS motif_deces       TEXT        DEFAULT NULL;

COMMENT ON COLUMN residents.statut_depart IS
  'NULL=présent, vacances=sortie temporaire, depart=départ définitif, deces=décédé';

-- ============================================================
-- 2. Mise à jour de la vue v_residents_priorite
--    (inclure statut_depart pour l'affichage)
-- ============================================================
DROP VIEW IF EXISTS v_residents_priorite CASCADE;

CREATE OR REPLACE VIEW v_residents_priorite AS
SELECT
  r.*,
  d.nom        AS medecin_nom,
  d.prenom     AS medecin_prenom,
  d.titre      AS medecin_titre,
  d.telephone  AS medecin_telephone,
  -- Dernière consultation
  c.date_consultation AS derniere_consultation,
  CASE
    WHEN c.date_consultation IS NULL THEN NULL
    ELSE (CURRENT_DATE - c.date_consultation::date)
  END AS jours_sans_consultation,
  -- Traitements urgents
  COALESCE((
    SELECT COUNT(*) FROM traitements t
    WHERE t.resident_id = r.id AND t.actif = TRUE
      AND t.traitement_chronique = FALSE
      AND t.date_fin IS NOT NULL
      AND t.date_fin <= (CURRENT_DATE + INTERVAL '1 day')
  ), 0) AS traitements_urgents,
  COALESCE((
    SELECT COUNT(*) FROM traitements t
    WHERE t.resident_id = r.id AND t.actif = TRUE
      AND t.traitement_chronique = FALSE
      AND t.date_fin IS NOT NULL
      AND t.date_fin <= (CURRENT_DATE + INTERVAL '3 days')
      AND t.date_fin > (CURRENT_DATE + INTERVAL '1 day')
  ), 0) AS traitements_bientot,
  -- Score de priorité
  COALESCE(
    CASE
      WHEN c.date_consultation IS NULL THEN 80
      WHEN (CURRENT_DATE - c.date_consultation::date) > 30 THEN 60
      WHEN (CURRENT_DATE - c.date_consultation::date) > 21 THEN 35
      WHEN (CURRENT_DATE - c.date_consultation::date) > 14 THEN 15
      ELSE 0
    END, 80)
  +
  COALESCE(
    CASE
      WHEN EXISTS (SELECT 1 FROM traitements t WHERE t.resident_id = r.id AND t.actif = TRUE AND t.traitement_chronique = FALSE AND t.date_fin IS NOT NULL AND t.date_fin <= (CURRENT_DATE + INTERVAL '1 day')) THEN 50
      WHEN EXISTS (SELECT 1 FROM traitements t WHERE t.resident_id = r.id AND t.actif = TRUE AND t.traitement_chronique = FALSE AND t.date_fin IS NOT NULL AND t.date_fin <= (CURRENT_DATE + INTERVAL '3 days')) THEN 25
      ELSE 0
    END, 0)
  +
  CASE r.niveau_priorite WHEN 1 THEN 40 WHEN 2 THEN 20 ELSE 0 END
  AS score_priorite
FROM residents r
LEFT JOIN doctors d ON d.id = r.medecin_id
LEFT JOIN LATERAL (
  SELECT date_consultation FROM consultations
  WHERE resident_id = r.id
  ORDER BY date_consultation DESC LIMIT 1
) c ON TRUE;

-- ============================================================
-- 3. Table visites (famille / proches)
-- ============================================================
CREATE TABLE IF NOT EXISTS visites (
  id                  UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id         UUID         NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  visiteur_nom        VARCHAR(100) NOT NULL,
  visiteur_prenom     VARCHAR(100) NOT NULL,
  visiteur_telephone  VARCHAR(30),
  visiteur_relation   VARCHAR(100),
  nb_personnes        INTEGER      DEFAULT 1 CHECK (nb_personnes >= 1 AND nb_personnes <= 50),
  autres_visiteurs    JSONB        DEFAULT '[]',
  -- [{ "nom": "...", "prenom": "..." }, ...]
  date_visite         DATE         NOT NULL DEFAULT CURRENT_DATE,
  heure_arrivee       TIMESTAMPTZ,
  heure_depart        TIMESTAMPTZ,
  est_planifiee       BOOLEAN      DEFAULT FALSE,
  statut              VARCHAR(20)  DEFAULT 'planifiee'
    CHECK (statut IN ('planifiee','en_cours','terminee','annulee')),
  notes               TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visites_resident   ON visites(resident_id);
CREATE INDEX IF NOT EXISTS idx_visites_date       ON visites(date_visite);
CREATE INDEX IF NOT EXISTS idx_visites_statut     ON visites(statut);

ALTER TABLE visites ENABLE ROW LEVEL SECURITY;

-- RLS visites (DROP d'abord pour idempotence)
DROP POLICY IF EXISTS "visites_select_auth" ON visites;
DROP POLICY IF EXISTS "visites_insert_auth" ON visites;
DROP POLICY IF EXISTS "visites_update_auth" ON visites;
DROP POLICY IF EXISTS "visites_delete_super" ON visites;

CREATE POLICY "visites_select_auth" ON visites
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND actif = TRUE));

CREATE POLICY "visites_insert_auth" ON visites
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND actif = TRUE));

CREATE POLICY "visites_update_auth" ON visites
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND actif = TRUE));

CREATE POLICY "visites_delete_super" ON visites
  FOR DELETE TO authenticated USING (fn_is_super_admin());

-- ============================================================
-- 4. Storage policies — bucket "photos-residents"
--    Utilise CREATE POLICY sur storage.objects (syntaxe correcte Supabase)
-- ============================================================

DROP POLICY IF EXISTS "photos_upload_auth"  ON storage.objects;
DROP POLICY IF EXISTS "photos_read_public"  ON storage.objects;
DROP POLICY IF EXISTS "photos_update_auth"  ON storage.objects;
DROP POLICY IF EXISTS "photos_delete_auth"  ON storage.objects;

-- Lecture publique (bucket public)
CREATE POLICY "photos_read_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'photos-residents');

-- Upload : utilisateurs authentifiés
CREATE POLICY "photos_upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos-residents');

-- Mise à jour : utilisateurs authentifiés
CREATE POLICY "photos_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'photos-residents');

-- Suppression : utilisateurs authentifiés
CREATE POLICY "photos_delete_auth" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos-residents');

-- ============================================================
-- NOTE : Si ces policies échouent encore, configurez-les
-- manuellement dans :
-- Dashboard Supabase → Storage → photos-residents → Policies
--   SELECT : public (All users)
--   INSERT : authenticated
--   UPDATE : authenticated
--   DELETE : authenticated
-- ============================================================

SELECT
  (SELECT COUNT(*) FROM residents WHERE statut_depart IS NOT NULL) AS residents_avec_depart,
  (SELECT COUNT(*) FROM visites) AS total_visites;
