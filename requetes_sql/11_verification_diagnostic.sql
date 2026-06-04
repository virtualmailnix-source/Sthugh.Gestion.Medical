-- ============================================================
--  11_verification_diagnostic.sql
--  Diagnostic complet de la base de données
--  Vérifie que toutes les tables et colonnes existent
--  À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── 1. Vérifier les colonnes de sorties dans residents ──────
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'residents'
  AND column_name  IN (
    'statut_depart','date_sortie','date_retour_prevue',
    'motif_sortie','motif_deces','taille','actif'
  )
ORDER BY column_name;

-- Résultat attendu : 7 lignes
-- Si statut_depart, date_sortie, etc. manquent → exécuter 10_departs_visites.sql

-- ── 2. Vérifier que la table visites existe ─────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name   = 'visites';

-- Résultat attendu : 1 ligne avec nb_colonnes = 12

-- ── 3. Toutes les tables du projet ─────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type   = 'BASE TABLE'
ORDER BY table_name;

-- Tables attendues : alertes, app_users, audit_log, cabinet,
-- consultations, contacts_famille, doctors, medicaments,
-- planning_residents, planning_visites, rendez_vous, residents,
-- traitements, visites

-- ── 4. Residents avec statut_depart (la vraie question) ─────
SELECT
  statut_depart,
  actif,
  COUNT(*) AS nb_residents
FROM residents
GROUP BY statut_depart, actif
ORDER BY statut_depart NULLS LAST;

-- Si vous avez ajouté des sorties/décès, vous devriez voir :
-- statut_depart = 'deces'    actif = false  nb = X
-- statut_depart = 'vacances' actif = true   nb = X
-- statut_depart = NULL       actif = true   nb = X (résidents présents)

-- ── 5. Voir les résidents avec une sortie (les 10 derniers) ──
SELECT
  id,
  nom,
  prenom,
  actif,
  statut_depart,
  date_sortie,
  motif_sortie,
  motif_deces
FROM residents
WHERE statut_depart IS NOT NULL
ORDER BY date_sortie DESC NULLS LAST
LIMIT 10;

-- ── 6. Vérifier la vue v_residents_priorite ────────────────
SELECT
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'v_residents_priorite'
  AND column_name  IN ('statut_depart','date_sortie','score_priorite')
ORDER BY column_name;

-- Si statut_depart manque dans la vue → la vue n'a pas été
-- recréée avec 10_departs_visites.sql
-- SOLUTION : exécuter uniquement cette partie :

-- DROP VIEW IF EXISTS v_residents_priorite CASCADE;
-- (puis copier le CREATE VIEW de 10_departs_visites.sql)

-- ── 7. Comptes généraux ─────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM residents)                          AS total_residents,
  (SELECT COUNT(*) FROM residents WHERE actif = TRUE)       AS actifs,
  (SELECT COUNT(*) FROM residents WHERE statut_depart IS NOT NULL) AS avec_sortie,
  (SELECT COUNT(*) FROM visites)                            AS total_visites,
  (SELECT COUNT(*) FROM rendez_vous)                        AS total_rdv,
  (SELECT COUNT(*) FROM consultations)                      AS total_consultations,
  (SELECT COUNT(*) FROM traitements WHERE actif = TRUE)     AS traitements_actifs;
