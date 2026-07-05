-- ============================================================
--  17_role_receptionniste.sql
--  St Hugh's Anglican Home - Rôle Réceptionniste (accueil)
--
--  Accès réceptionniste :
--    ✓ Résidents : identité / chambre / contacts famille (via v_residents_public)
--    ✓ Visites familiales (table visites), courses, historique vacances
--    ✓ Médecins (lecture : liste + contacts)
--    ✓ Sorties vacances + retour (RPC dédiées, pas de décès/départ définitif)
--    ✗ Tout le volet médical : traitements, consultations, rendez-vous,
--      alertes, médicaments, planification - SELECT refusé par RLS
--
--  À exécuter APRÈS les fichiers 01 à 16.
-- ============================================================

-- ── 1. Le rôle ───────────────────────────────────────────────
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('super_admin','admin','receptionniste'));

-- ── 2. Fonctions de rôle ─────────────────────────────────────
-- Staff médical = super_admin + admin (pas la réceptionniste)
CREATE OR REPLACE FUNCTION fn_is_medical_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
      AND actif = TRUE
      AND role IN ('super_admin','admin')
  );
$$;

CREATE OR REPLACE FUNCTION fn_is_receptionist()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
      AND actif = TRUE
      AND role = 'receptionniste'
  );
$$;

GRANT EXECUTE ON FUNCTION fn_is_medical_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION fn_is_receptionist() TO authenticated;

-- ── 3. Resserrer les tables MÉDICALES (app_user → staff médical) ──
-- residents : lecture directe réservée au staff médical
--             (la réceptionniste passe par v_residents_public)
DROP POLICY IF EXISTS "res_read" ON residents;
CREATE POLICY "res_read" ON residents FOR SELECT TO authenticated
  USING (fn_is_medical_staff());
DROP POLICY IF EXISTS "res_depart_write" ON residents;
CREATE POLICY "res_depart_write" ON residents FOR UPDATE TO authenticated
  USING (fn_is_medical_staff()) WITH CHECK (fn_is_medical_staff());

-- traitements
DROP POLICY IF EXISTS "trait_read"   ON traitements;
DROP POLICY IF EXISTS "trait_insert" ON traitements;
DROP POLICY IF EXISTS "trait_update" ON traitements;
CREATE POLICY "trait_read"   ON traitements FOR SELECT TO authenticated USING (fn_is_medical_staff());
CREATE POLICY "trait_insert" ON traitements FOR INSERT TO authenticated WITH CHECK (fn_is_medical_staff());
CREATE POLICY "trait_update" ON traitements FOR UPDATE TO authenticated USING (fn_is_medical_staff()) WITH CHECK (fn_is_medical_staff());

-- consultations
DROP POLICY IF EXISTS "cons_read"   ON consultations;
DROP POLICY IF EXISTS "cons_insert" ON consultations;
DROP POLICY IF EXISTS "cons_update" ON consultations;
CREATE POLICY "cons_read"   ON consultations FOR SELECT TO authenticated USING (fn_is_medical_staff());
CREATE POLICY "cons_insert" ON consultations FOR INSERT TO authenticated WITH CHECK (fn_is_medical_staff());
CREATE POLICY "cons_update" ON consultations FOR UPDATE TO authenticated USING (fn_is_medical_staff()) WITH CHECK (fn_is_medical_staff());

-- rendez_vous (visites médicales)
DROP POLICY IF EXISTS "rdv_read"   ON rendez_vous;
DROP POLICY IF EXISTS "rdv_insert" ON rendez_vous;
DROP POLICY IF EXISTS "rdv_update" ON rendez_vous;
CREATE POLICY "rdv_read"   ON rendez_vous FOR SELECT TO authenticated USING (fn_is_medical_staff());
CREATE POLICY "rdv_insert" ON rendez_vous FOR INSERT TO authenticated WITH CHECK (fn_is_medical_staff());
CREATE POLICY "rdv_update" ON rendez_vous FOR UPDATE TO authenticated USING (fn_is_medical_staff()) WITH CHECK (fn_is_medical_staff());

-- alertes (contenu médical)
DROP POLICY IF EXISTS "alert_read"   ON alertes;
DROP POLICY IF EXISTS "alert_insert" ON alertes;
DROP POLICY IF EXISTS "alert_update" ON alertes;
CREATE POLICY "alert_read"   ON alertes FOR SELECT TO authenticated USING (fn_is_medical_staff());
CREATE POLICY "alert_insert" ON alertes FOR INSERT TO authenticated WITH CHECK (fn_is_medical_staff());
CREATE POLICY "alert_update" ON alertes FOR UPDATE TO authenticated USING (fn_is_medical_staff()) WITH CHECK (fn_is_medical_staff());

-- medicaments (catalogue)
DROP POLICY IF EXISTS "med_read" ON medicaments;
CREATE POLICY "med_read" ON medicaments FOR SELECT TO authenticated USING (fn_is_medical_staff());

-- planification des visites médicales
DROP POLICY IF EXISTS "pv_read" ON planning_visites;
CREATE POLICY "pv_read" ON planning_visites FOR SELECT TO authenticated USING (fn_is_medical_staff());
DROP POLICY IF EXISTS "pr_read"   ON planning_residents;
DROP POLICY IF EXISTS "pr_insert" ON planning_residents;
DROP POLICY IF EXISTS "pr_update" ON planning_residents;
CREATE POLICY "pr_read"   ON planning_residents FOR SELECT TO authenticated USING (fn_is_medical_staff());
CREATE POLICY "pr_insert" ON planning_residents FOR INSERT TO authenticated WITH CHECK (fn_is_medical_staff());
CREATE POLICY "pr_update" ON planning_residents FOR UPDATE TO authenticated USING (fn_is_medical_staff()) WITH CHECK (fn_is_medical_staff());

-- Restent accessibles à TOUS les app_users actifs (réceptionniste incluse) :
--   doctors (lecture), contacts_famille (lecture), visites (familiales),
--   courses, historique_sorties - policies inchangées (fn_is_app_user)

-- ── 4. Les vues respectent la RLS des tables sous-jacentes ──
-- Sans cela, une vue s'exécute avec les droits de son propriétaire
-- et contournerait les restrictions ci-dessus.
ALTER VIEW v_residents_priorite   SET (security_invoker = on);
ALTER VIEW v_traitements_actifs   SET (security_invoker = on);
ALTER VIEW v_consultations_detail SET (security_invoker = on);
ALTER VIEW v_rdv_detail           SET (security_invoker = on);
ALTER VIEW v_planning_detail      SET (security_invoker = on);

-- ── 5. Vue publique résidents (colonnes NON médicales) ──────
-- Pas de security_invoker : la vue s'exécute avec les droits du
-- propriétaire (bypass RLS residents) mais son WHERE limite l'accès
-- aux utilisateurs actifs de l'application. Aucune colonne médicale :
-- ni médecin, ni allergies/antécédents/chroniques, ni priorité,
-- ni groupe sanguin, ni mobilité, ni notes, ni motif de décès.
DROP VIEW IF EXISTS v_residents_public;
CREATE VIEW v_residents_public AS
SELECT
  id, numero_chambre, nom, prenom, date_naissance, sexe,
  date_entree, photo_url, actif,
  statut_depart, date_sortie, date_retour_prevue, motif_sortie,
  created_at
FROM residents
WHERE fn_is_app_user();

GRANT SELECT ON v_residents_public TO authenticated;

-- ── 6. RPC sorties « accueil » (vacances uniquement) ─────────
-- La réceptionniste ne peut pas modifier residents directement (RLS).
-- Ces fonctions ne touchent QUE les champs de sortie temporaire.
CREATE OR REPLACE FUNCTION fn_accueil_sortie_vacances(
  p_resident_id UUID,
  p_date_sortie TIMESTAMPTZ DEFAULT NOW(),
  p_date_retour_prevue DATE DEFAULT NULL,
  p_motif TEXT DEFAULT NULL
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT fn_is_app_user() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  UPDATE residents
     SET statut_depart = 'vacances',
         date_sortie = p_date_sortie,
         date_retour_prevue = p_date_retour_prevue,
         motif_sortie = p_motif,
         actif = TRUE
   WHERE id = p_resident_id
     AND (statut_depart IS NULL);           -- jamais sur un décédé/parti
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION fn_accueil_retour(p_resident_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r RECORD;
BEGIN
  IF NOT fn_is_app_user() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  SELECT date_sortie, date_retour_prevue, motif_sortie INTO r
    FROM residents
   WHERE id = p_resident_id AND statut_depart = 'vacances';
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF r.date_sortie IS NOT NULL THEN
    INSERT INTO historique_sorties (resident_id, date_sortie, date_retour, date_retour_prevue, motif_sortie)
    VALUES (p_resident_id, r.date_sortie, NOW(), r.date_retour_prevue, r.motif_sortie);
  END IF;

  UPDATE residents
     SET statut_depart = NULL, date_sortie = NULL,
         date_retour_prevue = NULL, motif_sortie = NULL, actif = TRUE
   WHERE id = p_resident_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_accueil_sortie_vacances(UUID, TIMESTAMPTZ, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_accueil_retour(UUID) TO authenticated;

-- ── 6b. Résidents autonomes (module Courses) ────────────────
-- Renvoie uniquement le sous-ensemble nécessaire, sans exposer
-- la colonne mobilite elle-même.
CREATE OR REPLACE FUNCTION fn_residents_autonomes()
RETURNS TABLE (id UUID, nom VARCHAR, prenom VARCHAR, numero_chambre VARCHAR)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT r.id, r.nom, r.prenom, r.numero_chambre
  FROM residents r
  WHERE fn_is_app_user()
    AND r.mobilite = 'Autonome'
    AND r.actif = TRUE
    AND r.statut_depart IS NULL
  ORDER BY r.nom;
$$;

GRANT EXECUTE ON FUNCTION fn_residents_autonomes() TO authenticated;

-- ── 7. Créer une réceptionniste ──────────────────────────────
-- a. Supabase Dashboard → Authentication → Users → Add user
-- b. Copier l'UUID puis :
--    INSERT INTO app_users (auth_user_id, role, nom, prenom)
--    VALUES ('<UUID>', 'receptionniste', 'Nom', 'Prénom');
