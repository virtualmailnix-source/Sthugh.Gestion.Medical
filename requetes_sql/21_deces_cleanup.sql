-- ============================================================
--  21_deces_cleanup.sql
--  St Hugh's Anglican Home - Cohérence des dossiers décédés
--
--  Au passage du statut à « décédé » :
--    - niveau_priorite → NULL (plus de score d'urgence)
--    - actif → FALSE
--    - traitements désactivés (plus d'alertes médicaments)
--    - alertes en cours soldées (lue + traitée)
--    - rendez-vous futurs annulés
--  + correction rétroactive des décédés existants
--  + fn_generer_alertes_medicaments exclut inactifs et décédés
--
--  À exécuter APRÈS 20_traitements_stock.sql.
-- ============================================================

-- ── 1. Trigger décès ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_on_resident_deces()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.statut_depart = 'deces' AND OLD.statut_depart IS DISTINCT FROM 'deces' THEN
    NEW.niveau_priorite := NULL;
    NEW.actif := FALSE;

    UPDATE traitements
       SET actif = FALSE, alerte_renouvellement = FALSE
     WHERE resident_id = NEW.id AND actif = TRUE;

    UPDATE alertes
       SET lue = TRUE, traitee = TRUE
     WHERE resident_id = NEW.id AND traitee = FALSE;

    UPDATE rendez_vous
       SET statut = 'annule'
     WHERE resident_id = NEW.id
       AND statut IN ('planifie','confirme')
       AND date_rdv > NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resident_deces ON residents;
CREATE TRIGGER trg_resident_deces
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION fn_on_resident_deces();

-- La contrainte doit tolérer NULL (NULL IN (1,2,3) n'est pas FALSE,
-- donc la contrainte existante passe déjà - rien à modifier).

-- ── 2. Correction rétroactive des décédés existants ─────────
UPDATE residents SET niveau_priorite = NULL, actif = FALSE
 WHERE statut_depart = 'deces'
   AND (niveau_priorite IS NOT NULL OR actif = TRUE);

UPDATE traitements t SET actif = FALSE, alerte_renouvellement = FALSE
  FROM residents r
 WHERE t.resident_id = r.id AND r.statut_depart = 'deces' AND t.actif = TRUE;

UPDATE alertes a SET lue = TRUE, traitee = TRUE
  FROM residents r
 WHERE a.resident_id = r.id AND r.statut_depart = 'deces' AND a.traitee = FALSE;

UPDATE rendez_vous rv SET statut = 'annule'
  FROM residents r
 WHERE rv.resident_id = r.id AND r.statut_depart = 'deces'
   AND rv.statut IN ('planifie','confirme') AND rv.date_rdv > NOW();

-- ── 3. Alertes « pas vu 30 j » : exclure inactifs et décédés ──
CREATE OR REPLACE FUNCTION fn_generer_alertes_medicaments()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  t   RECORD;
  cnt INTEGER := 0;
BEGIN
  -- Alertes 24h (les traitements des décédés sont désactivés par trigger)
  FOR t IN
    SELECT t.id, t.resident_id, t.nom_medicament, t.date_fin
    FROM traitements t
    JOIN residents r ON r.id = t.resident_id
    WHERE t.actif=TRUE
      AND r.actif=TRUE
      AND (r.statut_depart IS NULL OR r.statut_depart = 'vacances')
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
      'Médicament à renouveler - ' || t.nom_medicament,
      'Le traitement "' || t.nom_medicament || '" se termine le ' || TO_CHAR(t.date_fin,'DD/MM/YYYY') || '. Renouvellement requis.',
      1
    );
    cnt := cnt + 1;
  END LOOP;

  -- Alertes résidents non vus depuis 30 jours (actifs uniquement)
  INSERT INTO alertes(type, resident_id, titre, message, priorite)
  SELECT
    'pas_vu_30j',
    r.id,
    'Consultation requise - ' || r.prenom || ' ' || r.nom,
    r.prenom || ' ' || r.nom || ' n''a pas eu de consultation depuis plus de 30 jours.',
    2
  FROM v_residents_priorite r
  WHERE (r.jours_sans_consultation > 30 OR r.derniere_consultation IS NULL)
    AND r.actif = TRUE
    AND r.statut_depart IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM alertes a
      WHERE a.resident_id=r.id
        AND a.type='pas_vu_30j'
        AND DATE(a.created_at) = CURRENT_DATE
    );

  RETURN cnt;
END;
$$;
