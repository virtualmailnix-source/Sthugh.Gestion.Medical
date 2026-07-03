-- ============================================================
--  14_reset_donnees.sql
--  St Hugh's Anglican Home — Remise à vierge des données
--
--  EFFET : supprime tous les résidents, médecins, médicaments
--          et données médicales associées. Ne touche PAS :
--            - app_users  (comptes du personnel)
--            - cabinet    (nom, adresse, téléphone du foyer — config établissement)
--
--  À EXÉCUTER depuis le Supabase SQL Editor (pas depuis l'app).
--  Irréversible — faire un backup avant si nécessaire.
-- ============================================================

BEGIN;

-- ── 1. Tables dépendantes des résidents ─────────────────────
--  La plupart ont ON DELETE CASCADE sur resident_id,
--  mais on les vide explicitement pour plus de clarté.

TRUNCATE TABLE audit_log           RESTART IDENTITY CASCADE;
TRUNCATE TABLE historique_sorties  RESTART IDENTITY CASCADE;
TRUNCATE TABLE courses             RESTART IDENTITY CASCADE;
TRUNCATE TABLE visites             RESTART IDENTITY CASCADE;
TRUNCATE TABLE planning_residents  RESTART IDENTITY CASCADE;
TRUNCATE TABLE alertes             RESTART IDENTITY CASCADE;
TRUNCATE TABLE rendez_vous         RESTART IDENTITY CASCADE;
TRUNCATE TABLE traitements         RESTART IDENTITY CASCADE;
TRUNCATE TABLE contacts_famille    RESTART IDENTITY CASCADE;
TRUNCATE TABLE consultations       RESTART IDENTITY CASCADE;

-- ── 2. Tables principales ────────────────────────────────────

TRUNCATE TABLE residents        RESTART IDENTITY CASCADE;
TRUNCATE TABLE planning_visites RESTART IDENTITY CASCADE;
TRUNCATE TABLE doctors          RESTART IDENTITY CASCADE;
TRUNCATE TABLE medicaments      RESTART IDENTITY CASCADE;

-- ── 3. Vérification ─────────────────────────────────────────

SELECT
  'residents'          AS table_name, COUNT(*) AS lignes FROM residents
UNION ALL SELECT 'doctors',           COUNT(*) FROM doctors
UNION ALL SELECT 'consultations',     COUNT(*) FROM consultations
UNION ALL SELECT 'traitements',       COUNT(*) FROM traitements
UNION ALL SELECT 'rendez_vous',       COUNT(*) FROM rendez_vous
UNION ALL SELECT 'alertes',           COUNT(*) FROM alertes
UNION ALL SELECT 'visites',           COUNT(*) FROM visites
UNION ALL SELECT 'courses',           COUNT(*) FROM courses
UNION ALL SELECT 'historique_sorties',COUNT(*) FROM historique_sorties
UNION ALL SELECT 'contacts_famille',  COUNT(*) FROM contacts_famille
UNION ALL SELECT 'planning_visites',  COUNT(*) FROM planning_visites
UNION ALL SELECT 'planning_residents',COUNT(*) FROM planning_residents
UNION ALL SELECT 'medicaments',        COUNT(*) FROM medicaments
UNION ALL SELECT 'audit_log',          COUNT(*) FROM audit_log
ORDER BY table_name;

-- Toutes les valeurs doivent être 0.
-- Les tables app_users et cabinet sont intactes.

COMMIT;
