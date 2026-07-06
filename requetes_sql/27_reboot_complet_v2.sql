-- ============================================================
--  27_reboot_complet_v2.sql
--  St Hugh's Anglican Home - Reboot complet de la base
--  Version adaptée à l'état post-SQL 26 (session 8)
--
--  EFFET : supprime TOUTES les données (résidents, médecins,
--          médicaments, demandes de visite en ligne, journal
--          d'activité, et toutes les tables liées) ainsi que les
--          fichiers des buckets photos-residents et ordonnances.
--
--  Ne touche PAS :
--    - app_users            (comptes du personnel)
--    - avatars du personnel (fichiers users/ du bucket photos-residents)
--    - cabinet              (remis à jour via ON CONFLICT DO NOTHING)
--    - le catalogue medicaments est vidé : ré-exécuter
--      04_seed_data.sql si on veut le retrouver
--
--  Notes techniques :
--    - TRUNCATE ne déclenche aucun trigger FOR EACH ROW : ni le
--      trigger d'audit générique (pas de pollution du journal),
--      ni trg_audit_immutable (le journal append-only se vide
--      donc bien par TRUNCATE, jamais par DELETE).
--    - STOCKAGE : Supabase interdit le DELETE direct sur
--      storage.objects (trigger storage.protect_delete, erreur
--      42501). Les fichiers photos/ordonnances devenus orphelins
--      se suppriment via l'API Storage : lancer ensuite
--      MAJ/reset_storage.sh (ou Dashboard > Storage : vider le
--      dossier residents/ de photos-residents en GARDANT users/,
--      et tout le bucket ordonnances). La vérification finale
--      affiche le nombre de fichiers restant à purger.
--
--  À EXÉCUTER depuis le Supabase SQL Editor (projet MÉDICAL).
--  Irréversible - faire un backup avant si nécessaire.
-- ============================================================

BEGIN;

-- ============================================================
-- PARTIE 1 - NETTOYAGE COMPLET
-- ============================================================

-- Journal d'activité (append-only : TRUNCATE seulement)
TRUNCATE TABLE audit_log           RESTART IDENTITY CASCADE;

-- Tables dépendantes des résidents
TRUNCATE TABLE demandes_visite     RESTART IDENTITY CASCADE;
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
-- PARTIE 2 - STOCKAGE : rien ici (interdit en SQL)
-- ============================================================
-- Le nettoyage des buckets se fait APRÈS ce script, hors SQL :
--   bash /home/hsergio/Bureau/MAJ/reset_storage.sh
-- (supprime residents/ du bucket photos-residents en gardant
-- users/, et vide le bucket ordonnances, via l'API Storage)

-- ============================================================
-- PARTIE 3 - DONNÉES DE BASE (état post-installation)
-- ============================================================

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
-- PARTIE 4 - VÉRIFICATION (tout doit être à 0 sauf cabinet)
-- ============================================================
SELECT
  'doctors'    AS table_name, COUNT(*) AS lignes FROM doctors
UNION ALL SELECT 'medicaments',       COUNT(*) FROM medicaments
UNION ALL SELECT 'residents',         COUNT(*) FROM residents
UNION ALL SELECT 'traitements',       COUNT(*) FROM traitements
UNION ALL SELECT 'consultations',     COUNT(*) FROM consultations
UNION ALL SELECT 'rendez_vous',       COUNT(*) FROM rendez_vous
UNION ALL SELECT 'alertes',           COUNT(*) FROM alertes
UNION ALL SELECT 'visites',           COUNT(*) FROM visites
UNION ALL SELECT 'demandes_visite',   COUNT(*) FROM demandes_visite
UNION ALL SELECT 'courses',           COUNT(*) FROM courses
UNION ALL SELECT 'historique_sorties',COUNT(*) FROM historique_sorties
UNION ALL SELECT 'planning_visites',  COUNT(*) FROM planning_visites
UNION ALL SELECT 'planning_residents',COUNT(*) FROM planning_residents
UNION ALL SELECT 'contacts_famille',  COUNT(*) FROM contacts_famille
UNION ALL SELECT 'audit_log',         COUNT(*) FROM audit_log
UNION ALL SELECT 'storage photos orphelines (a purger via reset_storage.sh)',
  COUNT(*) FROM storage.objects
  WHERE bucket_id = 'photos-residents' AND name NOT LIKE 'users/%'
UNION ALL SELECT 'storage ordonnances orphelines (a purger via reset_storage.sh)',
  COUNT(*) FROM storage.objects WHERE bucket_id = 'ordonnances'
ORDER BY table_name;

COMMIT;
