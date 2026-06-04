-- ============================================================
--  Fonctions, Triggers & Vues — St Hugh's Medical System
-- ============================================================

-- Trigger updated_at
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doctors_updated_at      BEFORE UPDATE ON doctors      FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_residents_updated_at    BEFORE UPDATE ON residents    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_traitements_updated_at  BEFORE UPDATE ON traitements  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_rdv_updated_at          BEFORE UPDATE ON rendez_vous  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_cabinet_updated_at      BEFORE UPDATE ON cabinet      FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
-- Vue centrale: résidents avec score de priorité
-- Plus le score est élevé = plus urgent
-- ============================================================
CREATE OR REPLACE VIEW v_residents_priorite AS
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
  r.contact_famille_nom,
  r.contact_famille_tel,
  r.notes_medicales,
  r.actif,
  r.photo_url,
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
  -- Total traitements actifs
  COUNT(t.id) FILTER (WHERE t.actif=TRUE)               AS nb_traitements,
  -- Score de priorité
  (
    -- A. Jours sans consultation
    CASE
      WHEN MAX(c.date_consultation) IS NULL                                   THEN 80
      WHEN CURRENT_DATE - DATE(MAX(c.date_consultation)) > 30                 THEN 60
      WHEN CURRENT_DATE - DATE(MAX(c.date_consultation)) BETWEEN 21 AND 30   THEN 35
      WHEN CURRENT_DATE - DATE(MAX(c.date_consultation)) BETWEEN 14 AND 20   THEN 15
      ELSE 0
    END
    +
    -- B. Médicaments urgents
    CASE
      WHEN COUNT(t.id) FILTER (WHERE t.actif=TRUE AND t.date_fin IS NOT NULL AND t.date_fin <= CURRENT_DATE + 1 AND t.traitement_chronique=FALSE) > 0 THEN 50
      WHEN COUNT(t.id) FILTER (WHERE t.actif=TRUE AND t.date_fin IS NOT NULL AND t.date_fin <= CURRENT_DATE + 3 AND t.traitement_chronique=FALSE) > 0 THEN 25
      ELSE 0
    END
    +
    -- C. Niveau de priorité manuel
    CASE r.niveau_priorite WHEN 1 THEN 40 WHEN 2 THEN 20 ELSE 0 END
  )                                                     AS score_priorite

FROM residents r
LEFT JOIN doctors d ON r.medecin_id = d.id
LEFT JOIN consultations c ON c.resident_id = r.id
LEFT JOIN traitements t   ON t.resident_id = r.id
WHERE r.actif = TRUE
GROUP BY r.id, d.id
ORDER BY score_priorite DESC, r.nom;

-- ============================================================
-- Vue: traitements avec jours restants
-- ============================================================
CREATE OR REPLACE VIEW v_traitements_actifs AS
SELECT
  t.*,
  r.nom          AS resident_nom,
  r.prenom       AS resident_prenom,
  r.numero_chambre,
  d.nom          AS medecin_nom,
  d.prenom       AS medecin_prenom,
  -- Jours restants (NULL si chronique ou sans date de fin)
  CASE WHEN t.date_fin IS NOT NULL
  THEN t.date_fin - CURRENT_DATE
  ELSE NULL END  AS jours_restants,
  -- Statut alerte
  CASE
    WHEN t.date_fin IS NULL OR t.traitement_chronique = TRUE THEN 'chronique'
    WHEN t.date_fin < CURRENT_DATE                           THEN 'expire'
    WHEN t.date_fin = CURRENT_DATE                           THEN 'expire_aujourd_hui'
    WHEN t.date_fin <= CURRENT_DATE + 1                      THEN 'alerte_24h'
    WHEN t.date_fin <= CURRENT_DATE + 3                      THEN 'alerte_3j'
    WHEN t.date_fin <= CURRENT_DATE + 7                      THEN 'alerte_7j'
    ELSE 'ok'
  END            AS statut_alerte
FROM traitements t
JOIN residents r ON t.resident_id = r.id
LEFT JOIN doctors d ON t.prescrit_par = d.id
WHERE t.actif = TRUE
ORDER BY
  CASE WHEN t.date_fin IS NULL THEN 999
       ELSE t.date_fin - CURRENT_DATE END,
  r.nom;

-- ============================================================
-- Vue: consultations détaillées
-- ============================================================
CREATE OR REPLACE VIEW v_consultations_detail AS
SELECT
  c.*,
  r.nom          AS resident_nom,
  r.prenom       AS resident_prenom,
  r.numero_chambre,
  r.date_naissance,
  d.titre        AS medecin_titre,
  d.nom          AS medecin_nom,
  d.prenom       AS medecin_prenom
FROM consultations c
JOIN residents r  ON c.resident_id = r.id
LEFT JOIN doctors d ON c.medecin_id = d.id
ORDER BY c.date_consultation DESC;

-- ============================================================
-- Vue: rendez-vous détaillés
-- ============================================================
CREATE OR REPLACE VIEW v_rdv_detail AS
SELECT
  rv.*,
  r.nom         AS resident_nom,
  r.prenom      AS resident_prenom,
  r.numero_chambre,
  r.niveau_priorite,
  d.titre       AS medecin_titre,
  d.nom         AS medecin_nom,
  d.prenom      AS medecin_prenom
FROM rendez_vous rv
JOIN residents r  ON rv.resident_id = r.id
LEFT JOIN doctors d ON rv.medecin_id = d.id
ORDER BY rv.date_rdv;

-- ============================================================
-- Vue: planning avec résidents
-- ============================================================
CREATE OR REPLACE VIEW v_planning_detail AS
SELECT
  pv.*,
  d.titre      AS medecin_titre,
  d.nom        AS medecin_nom,
  d.prenom     AS medecin_prenom,
  COUNT(pr.id) AS nb_residents_planifies,
  COUNT(pr.id) FILTER (WHERE pr.statut='effectue') AS nb_effectues
FROM planning_visites pv
LEFT JOIN doctors d          ON pv.medecin_id = d.id
LEFT JOIN planning_residents pr ON pr.planning_id = pv.id
GROUP BY pv.id, d.id
ORDER BY pv.date_visite DESC;

-- ============================================================
-- Fonction RPC: statistiques du tableau de bord
-- ============================================================
CREATE OR REPLACE FUNCTION fn_dashboard_stats()
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_residents',       (SELECT COUNT(*) FROM residents WHERE actif=TRUE),
    'consultations_today',   (SELECT COUNT(*) FROM consultations WHERE DATE(date_consultation)=CURRENT_DATE),
    'rdv_today',             (SELECT COUNT(*) FROM rendez_vous WHERE DATE(date_rdv)=CURRENT_DATE AND statut IN ('planifie','confirme')),
    'alertes_non_lues',      (SELECT COUNT(*) FROM alertes WHERE lue=FALSE AND traitee=FALSE),
    'medicaments_urgents',   (SELECT COUNT(DISTINCT resident_id) FROM traitements WHERE actif=TRUE AND date_fin IS NOT NULL AND date_fin<=CURRENT_DATE+1 AND traitement_chronique=FALSE),
    'medicaments_bientot',   (SELECT COUNT(DISTINCT resident_id) FROM traitements WHERE actif=TRUE AND date_fin IS NOT NULL AND date_fin<=CURRENT_DATE+3 AND traitement_chronique=FALSE),
    'pas_vu_30j',            (SELECT COUNT(*) FROM v_residents_priorite WHERE jours_sans_consultation>30 OR derniere_consultation IS NULL),
    'residents_urgents',     (SELECT COUNT(*) FROM residents WHERE actif=TRUE AND niveau_priorite=1),
    'rdv_semaine',           (SELECT COUNT(*) FROM rendez_vous WHERE date_rdv >= DATE_TRUNC('week',NOW()) AND date_rdv < DATE_TRUNC('week',NOW())+INTERVAL '7 days' AND statut IN ('planifie','confirme')),
    'total_doctors',         (SELECT COUNT(*) FROM doctors WHERE actif=TRUE)
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- Fonction RPC: générer les alertes médicaments (à appeler quotidiennement)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generer_alertes_medicaments()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  t   RECORD;
  cnt INTEGER := 0;
BEGIN
  -- Alertes 24h
  FOR t IN
    SELECT t.id, t.resident_id, t.nom_medicament, t.date_fin
    FROM traitements t
    WHERE t.actif=TRUE
      AND t.traitement_chronique=FALSE
      AND t.date_fin IS NOT NULL
      AND t.date_fin <= CURRENT_DATE + 1
      AND t.alerte_renouvellement = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM alertes a
        WHERE a.resident_id=t.resident_id
          AND a.type='medicament_24h'
          AND DATE(a.created_at) = CURRENT_DATE
          AND a.message LIKE '%' || t.nom_medicament || '%'
      )
  LOOP
    INSERT INTO alertes(type, resident_id, titre, message, priorite)
    VALUES (
      'medicament_24h',
      t.resident_id,
      'Médicament à renouveler — ' || t.nom_medicament,
      'Le traitement "' || t.nom_medicament || '" se termine le ' || TO_CHAR(t.date_fin,'DD/MM/YYYY') || '. Renouvellement requis.',
      1
    );
    cnt := cnt + 1;
  END LOOP;

  -- Alertes résidents non vus depuis 30 jours
  INSERT INTO alertes(type, resident_id, titre, message, priorite)
  SELECT
    'pas_vu_30j',
    r.id,
    'Consultation requise — ' || r.prenom || ' ' || r.nom,
    r.prenom || ' ' || r.nom || ' n''a pas eu de consultation depuis plus de 30 jours.',
    2
  FROM v_residents_priorite r
  WHERE (r.jours_sans_consultation > 30 OR r.derniere_consultation IS NULL)
    AND NOT EXISTS (
      SELECT 1 FROM alertes a
      WHERE a.resident_id=r.id
        AND a.type='pas_vu_30j'
        AND DATE(a.created_at) = CURRENT_DATE
    );

  RETURN cnt;
END;
$$;

-- ============================================================
-- Fonction RPC: liste priorisée pour planification
-- Retourne les N prochains résidents à voir
-- ============================================================
CREATE OR REPLACE FUNCTION fn_residents_a_planifier(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  resident_id UUID,
  nom TEXT, prenom TEXT, numero_chambre VARCHAR,
  score_priorite BIGINT,
  jours_sans_consultation BIGINT,
  traitements_urgents BIGINT,
  traitements_bientot BIGINT,
  derniere_consultation TIMESTAMPTZ,
  medecin_nom TEXT
) LANGUAGE sql STABLE AS $$
  SELECT
    id AS resident_id,
    nom, prenom, numero_chambre,
    score_priorite,
    jours_sans_consultation,
    traitements_urgents,
    traitements_bientot,
    derniere_consultation,
    COALESCE(medecin_prenom || ' ' || medecin_nom, '—') AS medecin_nom
  FROM v_residents_priorite
  WHERE actif = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM planning_residents pr
      JOIN planning_visites pv ON pr.planning_id = pv.id
      WHERE pr.resident_id = v_residents_priorite.id
        AND pv.date_visite >= CURRENT_DATE
        AND pr.statut = 'planifie'
    )
  ORDER BY score_priorite DESC, nom
  LIMIT p_limit;
$$;

-- ============================================================
-- Fonction RPC: statistiques 30 jours
-- ============================================================
CREATE OR REPLACE FUNCTION fn_stats_30_jours()
RETURNS TABLE(jour DATE, total BIGINT) LANGUAGE sql STABLE AS $$
  SELECT gs.jour::DATE, COALESCE(COUNT(c.id),0) AS total
  FROM generate_series(CURRENT_DATE-29, CURRENT_DATE, INTERVAL '1 day') AS gs(jour)
  LEFT JOIN consultations c ON DATE(c.date_consultation) = gs.jour::DATE
  GROUP BY gs.jour ORDER BY gs.jour;
$$;
