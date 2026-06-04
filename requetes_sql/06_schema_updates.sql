-- ============================================================
--  06 — Mises à jour du schéma
--  Exécuter en 6e dans Supabase SQL Editor
--  1. Table contacts_famille (remplace les colonnes uniques)
--  2. Colonne taille dans residents
--  3. Contrainte sexe : Masculin/Féminin uniquement
--  4. Vue v_residents_priorite mise à jour
--  5. RLS basé sur l'authentification (remplace les policies anon)
-- ============================================================

-- ============================================================
-- 1. Table contacts_famille
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts_famille (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id   UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  nom           VARCHAR(200) NOT NULL,
  telephone     VARCHAR(30),
  relation      VARCHAR(50),
  est_principal BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_resident ON contacts_famille(resident_id);

ALTER TABLE contacts_famille ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Supprimer anciens champs contact + ajouter taille
-- ============================================================

-- Supprimer la vue qui dépend des colonnes avant de les effacer
DROP VIEW IF EXISTS v_residents_priorite;

-- Migration des données existantes avant suppression (si nécessaire)
INSERT INTO contacts_famille (resident_id, nom, telephone, relation, est_principal)
SELECT id, contact_famille_nom, contact_famille_tel, contact_famille_relation, TRUE
FROM residents
WHERE contact_famille_nom IS NOT NULL AND contact_famille_nom <> ''
ON CONFLICT DO NOTHING;

ALTER TABLE residents DROP COLUMN IF EXISTS contact_famille_nom;
ALTER TABLE residents DROP COLUMN IF EXISTS contact_famille_tel;
ALTER TABLE residents DROP COLUMN IF EXISTS contact_famille_relation;

ALTER TABLE residents ADD COLUMN IF NOT EXISTS taille NUMERIC(5,2);

-- ============================================================
-- 3. Contrainte sexe : Masculin/Féminin seulement
-- ============================================================
ALTER TABLE residents DROP CONSTRAINT IF EXISTS residents_sexe_check;
ALTER TABLE residents ADD CONSTRAINT residents_sexe_check
  CHECK (sexe IN ('Masculin','Féminin'));

-- Si des résidents avaient 'Autre', les mettre à NULL
UPDATE residents SET sexe = NULL WHERE sexe NOT IN ('Masculin','Féminin');

-- ============================================================
-- 4. Recréer la vue v_residents_priorite
--    (sans colonnes contact supprimées, avec taille)
-- ============================================================
CREATE VIEW v_residents_priorite AS
SELECT
  r.id,
  r.numero_chambre,
  r.nom,
  r.prenom,
  r.date_naissance,
  r.sexe,
  r.date_entree,
  r.medecin_id,
  r.groupe_sanguin,
  r.allergies,
  r.conditions_chroniques,
  r.mobilite,
  r.niveau_priorite,
  r.notes_medicales,
  r.actif,
  r.photo_url,
  r.taille,
  -- Médecin traitant
  d.titre        AS medecin_titre,
  d.nom          AS medecin_nom,
  d.prenom       AS medecin_prenom,
  d.telephone    AS medecin_telephone,
  -- Dernière consultation
  MAX(c.date_consultation)                             AS derniere_consultation,
  CURRENT_DATE - DATE(MAX(c.date_consultation))        AS jours_sans_consultation,
  -- Médicaments urgents (fin dans ≤1 jour)
  COUNT(t.id) FILTER (
    WHERE t.actif=TRUE AND t.date_fin IS NOT NULL
      AND t.date_fin <= CURRENT_DATE + 1
      AND t.traitement_chronique = FALSE
  )                                                     AS traitements_urgents,
  -- Médicaments bientôt (fin dans ≤3 jours)
  COUNT(t.id) FILTER (
    WHERE t.actif=TRUE AND t.date_fin IS NOT NULL
      AND t.date_fin <= CURRENT_DATE + 3
      AND t.traitement_chronique = FALSE
  )                                                     AS traitements_bientot,
  COUNT(t.id) FILTER (WHERE t.actif=TRUE)               AS nb_traitements,
  -- Score de priorité
  (
    CASE
      WHEN MAX(c.date_consultation) IS NULL                                   THEN 80
      WHEN CURRENT_DATE - DATE(MAX(c.date_consultation)) > 30                 THEN 60
      WHEN CURRENT_DATE - DATE(MAX(c.date_consultation)) BETWEEN 21 AND 30   THEN 35
      WHEN CURRENT_DATE - DATE(MAX(c.date_consultation)) BETWEEN 14 AND 20   THEN 15
      ELSE 0
    END
    +
    CASE
      WHEN COUNT(t.id) FILTER (
        WHERE t.actif=TRUE AND t.date_fin IS NOT NULL
          AND t.date_fin <= CURRENT_DATE + 1 AND t.traitement_chronique=FALSE
      ) > 0 THEN 50
      WHEN COUNT(t.id) FILTER (
        WHERE t.actif=TRUE AND t.date_fin IS NOT NULL
          AND t.date_fin <= CURRENT_DATE + 3 AND t.traitement_chronique=FALSE
      ) > 0 THEN 25
      ELSE 0
    END
    +
    CASE r.niveau_priorite WHEN 1 THEN 40 WHEN 2 THEN 20 ELSE 0 END
  ) AS score_priorite

FROM residents r
LEFT JOIN doctors d ON r.medecin_id = d.id
LEFT JOIN consultations c ON c.resident_id = r.id
LEFT JOIN traitements t   ON t.resident_id = r.id
WHERE r.actif = TRUE
GROUP BY r.id, d.id
ORDER BY score_priorite DESC, r.nom;

-- ============================================================
-- 5. Nouvelles RLS basées sur l'authentification
-- ============================================================

-- Supprimer les anciennes policies anon
DROP POLICY IF EXISTS "rls_doctors_all"            ON doctors;
DROP POLICY IF EXISTS "rls_residents_all"          ON residents;
DROP POLICY IF EXISTS "rls_medicaments_all"        ON medicaments;
DROP POLICY IF EXISTS "rls_traitements_all"        ON traitements;
DROP POLICY IF EXISTS "rls_consultations_all"      ON consultations;
DROP POLICY IF EXISTS "rls_rdv_all"                ON rendez_vous;
DROP POLICY IF EXISTS "rls_alertes_all"            ON alertes;
DROP POLICY IF EXISTS "rls_planning_visites_all"   ON planning_visites;
DROP POLICY IF EXISTS "rls_planning_residents_all" ON planning_residents;
DROP POLICY IF EXISTS "rls_cabinet_all"            ON cabinet;

-- ─── doctors ─────────────────────────────────────────────────
CREATE POLICY "doc_read"  ON doctors FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "doc_write" ON doctors FOR ALL    TO authenticated USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());

-- ─── residents ───────────────────────────────────────────────
CREATE POLICY "res_read"  ON residents FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "res_write" ON residents FOR ALL    TO authenticated USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());

-- ─── contacts_famille ────────────────────────────────────────
CREATE POLICY "cf_read"  ON contacts_famille FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "cf_write" ON contacts_famille FOR ALL    TO authenticated USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());

-- ─── medicaments ─────────────────────────────────────────────
CREATE POLICY "med_read"  ON medicaments FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "med_write" ON medicaments FOR ALL    TO authenticated USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());

-- ─── traitements ─────────────────────────────────────────────
CREATE POLICY "trait_read"   ON traitements FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "trait_insert" ON traitements FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());
CREATE POLICY "trait_update" ON traitements FOR UPDATE TO authenticated USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());
CREATE POLICY "trait_delete" ON traitements FOR DELETE TO authenticated USING (fn_is_super_admin());

-- ─── consultations ───────────────────────────────────────────
CREATE POLICY "cons_read"   ON consultations FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "cons_insert" ON consultations FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());
CREATE POLICY "cons_update" ON consultations FOR UPDATE TO authenticated USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());
CREATE POLICY "cons_delete" ON consultations FOR DELETE TO authenticated USING (fn_is_super_admin());

-- ─── rendez_vous ─────────────────────────────────────────────
CREATE POLICY "rdv_read"   ON rendez_vous FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "rdv_insert" ON rendez_vous FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());
CREATE POLICY "rdv_update" ON rendez_vous FOR UPDATE TO authenticated USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());
CREATE POLICY "rdv_delete" ON rendez_vous FOR DELETE TO authenticated USING (fn_is_super_admin());

-- ─── alertes ─────────────────────────────────────────────────
CREATE POLICY "alert_read"   ON alertes FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "alert_insert" ON alertes FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());
CREATE POLICY "alert_update" ON alertes FOR UPDATE TO authenticated USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());
CREATE POLICY "alert_delete" ON alertes FOR DELETE TO authenticated USING (fn_is_super_admin());

-- ─── planning_visites ────────────────────────────────────────
CREATE POLICY "pv_read"  ON planning_visites FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "pv_write" ON planning_visites FOR ALL    TO authenticated USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());

-- ─── planning_residents ──────────────────────────────────────
CREATE POLICY "pr_read"   ON planning_residents FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "pr_insert" ON planning_residents FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());
CREATE POLICY "pr_update" ON planning_residents FOR UPDATE TO authenticated USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());
CREATE POLICY "pr_delete" ON planning_residents FOR DELETE TO authenticated USING (fn_is_super_admin());

-- ─── cabinet ─────────────────────────────────────────────────
CREATE POLICY "cab_read"  ON cabinet FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "cab_write" ON cabinet FOR ALL    TO authenticated USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());
