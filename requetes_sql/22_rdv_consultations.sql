-- ============================================================
--  22_rdv_consultations.sql
--  St Hugh's Anglican Home — Unification RDV / Consultations
--
--  Règle métier : un RDV et une consultation sont la même entité
--  à deux moments différents.
--    - RDV passé (date échue ou statut « effectué ») = consultation
--    - RDV futur = consultation à venir
--    - RDV annulé ou absent ≠ consultation
--  Approche : VUE UNIFIÉE (pas de conversion ni de double saisie).
--
--  À exécuter APRÈS 21_deces_cleanup.sql.
-- ============================================================

-- ── 1. Vue unifiée : consultations saisies + RDV échus ───────
DROP VIEW IF EXISTS v_consultations_unifiees;
CREATE VIEW v_consultations_unifiees AS
SELECT
  c.id, c.resident_id, c.medecin_id,
  c.date_consultation,
  c.motif, c.diagnostic, c.ordonnance_url, c.ordonnance_nom,
  'consultation'::TEXT AS source,
  r.nom    AS resident_nom,
  r.prenom AS resident_prenom,
  r.numero_chambre,
  d.titre  AS medecin_titre,
  d.nom    AS medecin_nom,
  d.prenom AS medecin_prenom
FROM consultations c
JOIN residents r  ON c.resident_id = r.id
LEFT JOIN doctors d ON c.medecin_id = d.id
UNION ALL
SELECT
  rv.id, rv.resident_id, rv.medecin_id,
  rv.date_rdv AS date_consultation,
  rv.motif,
  NULL AS diagnostic, NULL AS ordonnance_url, NULL AS ordonnance_nom,
  'rdv'::TEXT AS source,
  r.nom, r.prenom, r.numero_chambre,
  d.titre, d.nom, d.prenom
FROM rendez_vous rv
JOIN residents r  ON rv.resident_id = r.id
LEFT JOIN doctors d ON rv.medecin_id = d.id
WHERE rv.statut NOT IN ('annule','absent')
  AND (rv.date_rdv <= NOW() OR rv.statut = 'effectue');

ALTER VIEW v_consultations_unifiees SET (security_invoker = on);

-- ── 2. Dernière consultation = max(consultation, RDV échu) ───
-- Corrige le « Jamais » affiché quand seuls des RDV passés existent.
DROP VIEW IF EXISTS v_residents_priorite;
CREATE VIEW v_residents_priorite AS
SELECT
  r.*,
  d.nom        AS medecin_nom,
  d.prenom     AS medecin_prenom,
  d.titre      AS medecin_titre,
  d.telephone  AS medecin_telephone,
  c.date_consultation AS derniere_consultation,
  CASE
    WHEN c.date_consultation IS NULL THEN NULL
    ELSE (CURRENT_DATE - c.date_consultation::date)
  END AS jours_sans_consultation,
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
  -- Consultations saisies + RDV échus non annulés/absents
  SELECT MAX(x.dt) AS date_consultation FROM (
    SELECT date_consultation AS dt FROM consultations
     WHERE resident_id = r.id
    UNION ALL
    SELECT date_rdv FROM rendez_vous
     WHERE resident_id = r.id
       AND statut NOT IN ('annule','absent')
       AND (date_rdv <= NOW() OR statut = 'effectue')
  ) x
) c ON TRUE;

ALTER VIEW v_residents_priorite SET (security_invoker = on);

-- ── 3. Stats dashboard alignées ──────────────────────────────
-- consultations_today inclut les RDV échus du jour ;
-- pas_vu_30j se limite aux résidents présents.
CREATE OR REPLACE FUNCTION fn_dashboard_stats()
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_residents',       (SELECT COUNT(*) FROM residents WHERE actif=TRUE),
    'consultations_today',   (SELECT COUNT(*) FROM v_consultations_unifiees WHERE DATE(date_consultation)=CURRENT_DATE),
    'rdv_today',             (SELECT COUNT(*) FROM rendez_vous WHERE DATE(date_rdv)=CURRENT_DATE AND statut IN ('planifie','confirme')),
    'alertes_non_lues',      (SELECT COUNT(*) FROM alertes WHERE lue=FALSE AND traitee=FALSE),
    'medicaments_urgents',   (SELECT COUNT(DISTINCT resident_id) FROM traitements WHERE actif=TRUE AND date_fin IS NOT NULL AND date_fin<=CURRENT_DATE+1 AND traitement_chronique=FALSE),
    'medicaments_bientot',   (SELECT COUNT(DISTINCT resident_id) FROM traitements WHERE actif=TRUE AND date_fin IS NOT NULL AND date_fin<=CURRENT_DATE+3 AND traitement_chronique=FALSE),
    'pas_vu_30j',            (SELECT COUNT(*) FROM v_residents_priorite WHERE (jours_sans_consultation>30 OR derniere_consultation IS NULL) AND actif=TRUE AND statut_depart IS NULL),
    'residents_urgents',     (SELECT COUNT(*) FROM residents WHERE actif=TRUE AND niveau_priorite=1 AND (statut_depart IS NULL OR statut_depart <> 'deces')),
    'rdv_semaine',           (SELECT COUNT(*) FROM rendez_vous WHERE date_rdv >= DATE_TRUNC('week',NOW()) AND date_rdv < DATE_TRUNC('week',NOW())+INTERVAL '7 days' AND statut IN ('planifie','confirme')),
    'total_doctors',         (SELECT COUNT(*) FROM doctors WHERE actif=TRUE)
  ) INTO result;
  RETURN result;
END;
$$;
