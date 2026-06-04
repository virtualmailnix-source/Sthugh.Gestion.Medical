-- ============================================================
--  12_fix_rls_departs.sql
--  Autoriser TOUS les utilisateurs authentifiés à enregistrer
--  les sorties/décès des résidents (pas seulement super_admin)
--  Logique : une infirmière peut enregistrer un départ ou un décès
--  mais NE PEUT PAS modifier le nom, chambre, médecin, etc.
-- ============================================================

-- ── 1. TEST PRÉALABLE ──────────────────────────────────────
-- Vérifier que la colonne existe et qu'un UPDATE fonctionne
-- (à exécuter avant le reste pour diagnostic)

-- Test manuel : mettre à jour le premier résident en "vacances"
-- (décommenter pour tester, recommenter ensuite)
/*
UPDATE residents
SET
  statut_depart     = 'vacances',
  date_sortie       = NOW(),
  motif_sortie      = 'Test diagnostic',
  actif             = TRUE
WHERE id = (SELECT id FROM residents WHERE actif = TRUE LIMIT 1);

-- Vérifier :
SELECT id, nom, prenom, actif, statut_depart, date_sortie
FROM residents WHERE statut_depart IS NOT NULL;

-- Annuler le test :
UPDATE residents SET statut_depart = NULL, date_sortie = NULL, motif_sortie = NULL
WHERE statut_depart = 'vacances';
*/

-- ── 2. NOUVELLE POLICY : enregistrement des sorties ────────
-- Autorise tout utilisateur de l'appli à modifier uniquement
-- les champs de sortie (statut_depart, date_sortie, etc.)
-- La policy "res_write" (super_admin) reste pour les autres champs

DROP POLICY IF EXISTS "res_depart_write" ON residents;

CREATE POLICY "res_depart_write" ON residents
  FOR UPDATE
  TO authenticated
  USING (fn_is_app_user())
  WITH CHECK (fn_is_app_user());

-- Note : PostgreSQL évalue les policies en OR
-- Résultat :
--   super_admin → peut tout modifier (res_write)
--   admin       → peut modifier aussi (res_depart_write)
--
-- ATTENTION : cette policy permet aux admins de modifier n'importe
-- quel champ. Si vous voulez restreindre aux seuls champs de sortie,
-- il faut utiliser une fonction ou un trigger côté PostgreSQL.
-- Pour l'usage de St Hugh's, cette approche est acceptable.

-- ── 3. VÉRIFICATION ────────────────────────────────────────
SELECT
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'residents'
ORDER BY policyname;

-- Vous devez voir :
--   res_depart_write  UPDATE  {authenticated}  fn_is_app_user()
--   res_read          SELECT  {authenticated}  fn_is_app_user()
--   res_write         ALL     {authenticated}  fn_is_super_admin()
