-- ============================================================
--  16_reboot_complet.sql
--  St Hugh's Anglican Home — Reboot complet de la base
--
--  EFFET : supprime TOUTES les données fictives (résidents,
--          médecins, médicaments, et toutes les tables liées)
--          
--  Ne touche PAS :
--    - app_users  (comptes du personnel)
--    - cabinet    (remis à jour via ON CONFLICT DO NOTHING)
--
--  À EXÉCUTER depuis le Supabase SQL Editor.
--  Irréversible — faire un backup avant si nécessaire.
-- ============================================================

BEGIN;

-- ============================================================
-- PARTIE 1 — NETTOYAGE COMPLET
-- ============================================================

-- Tables dépendantes des résidents
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

-- Tables principales
TRUNCATE TABLE residents        RESTART IDENTITY CASCADE;
TRUNCATE TABLE planning_visites RESTART IDENTITY CASCADE;
TRUNCATE TABLE doctors          RESTART IDENTITY CASCADE;
TRUNCATE TABLE medicaments      RESTART IDENTITY CASCADE;

-- ============================================================
-- PARTIE 2 — DONNÉES DE BASE (état post-installation)
-- ============================================================

-- ── Cabinet ──────────────────────────────────────────────────
INSERT INTO cabinet (nom, adresse, telephone, jours_visites, entete_ordonnance)
VALUES (
  'St Hugh''s Anglican Home',
  'Rose Hill, Mauritius',
  '4641124',
  'Mardi, Vendredi',
  'St Hugh''s Anglican Home
Rose Hill, Mauritius
Tél: 4641124'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- PARTIE 3 — VÉRIFICATION
-- ============================================================
SELECT
  'doctors'    AS table_name, COUNT(*) AS lignes FROM doctors
UNION ALL SELECT 'medicaments',  COUNT(*) FROM medicaments
UNION ALL SELECT 'residents',    COUNT(*) FROM residents
UNION ALL SELECT 'traitements',  COUNT(*) FROM traitements
UNION ALL SELECT 'consultations',COUNT(*) FROM consultations
UNION ALL SELECT 'rendez_vous',  COUNT(*) FROM rendez_vous
UNION ALL SELECT 'alertes',      COUNT(*) FROM alertes
UNION ALL SELECT 'visites',      COUNT(*) FROM visites
UNION ALL SELECT 'courses',      COUNT(*) FROM courses
UNION ALL SELECT 'historique_sorties',COUNT(*) FROM historique_sorties
UNION ALL SELECT 'planning_visites',  COUNT(*) FROM planning_visites
UNION ALL SELECT 'planning_residents',COUNT(*) FROM planning_residents
UNION ALL SELECT 'contacts_famille',  COUNT(*) FROM contacts_famille
UNION ALL SELECT 'audit_log',         COUNT(*) FROM audit_log
ORDER BY table_name;



COMMIT;
