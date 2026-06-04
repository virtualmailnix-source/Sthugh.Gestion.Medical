-- ============================================================
--  08_anniversaires.sql
--  Fonction : génération automatique des alertes anniversaires
--  À exécuter dans Supabase SQL Editor
-- ============================================================

-- Autoriser le type 'anniversaire' dans la table alertes
-- (si la colonne 'type' a une contrainte CHECK, on l'élargit)
DO $$
BEGIN
  -- Tente de supprimer l'ancienne contrainte si elle existe
  ALTER TABLE alertes DROP CONSTRAINT IF EXISTS alertes_type_check;
EXCEPTION WHEN others THEN NULL;
END;
$$;

-- ── Fonction principale ────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_generer_alertes_anniversaires()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_tmp   integer := 0;
BEGIN
  -- Supprimer les alertes anniversaires déjà générées aujourd'hui
  -- (pour éviter les doublons si on appelle la fonction plusieurs fois)
  DELETE FROM alertes
  WHERE type = 'anniversaire'
    AND DATE(created_at) = CURRENT_DATE;

  -- ── Anniversaires AUJOURD'HUI ──────────────────────────
  INSERT INTO alertes (type, resident_id, titre, message, priorite, lue, traitee)
  SELECT
    'anniversaire',
    r.id,
    'Anniversaire aujourd''hui — ' || r.prenom || ' ' || r.nom,
    r.prenom || ' ' || r.nom || ' fête ses '
      || (EXTRACT(YEAR FROM CURRENT_DATE)::int - EXTRACT(YEAR FROM r.date_naissance)::int)
      || ' ans aujourd''hui !',
    1,   -- priorité haute
    false,
    false
  FROM residents r
  WHERE r.actif = TRUE
    AND r.date_naissance IS NOT NULL
    AND EXTRACT(MONTH FROM r.date_naissance) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY   FROM r.date_naissance) = EXTRACT(DAY   FROM CURRENT_DATE);

  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_count := v_count + v_tmp;

  -- ── Anniversaires DEMAIN (alerte préventive 24h) ───────
  INSERT INTO alertes (type, resident_id, titre, message, priorite, lue, traitee)
  SELECT
    'anniversaire',
    r.id,
    'Anniversaire demain — ' || r.prenom || ' ' || r.nom,
    r.prenom || ' ' || r.nom || ' fêtera ses '
      || (EXTRACT(YEAR FROM CURRENT_DATE)::int - EXTRACT(YEAR FROM r.date_naissance)::int + 1)
      || ' ans le ' || TO_CHAR(r.date_naissance, 'DD/MM') || '.',
    2,   -- priorité normale
    false,
    false
  FROM residents r
  WHERE r.actif = TRUE
    AND r.date_naissance IS NOT NULL
    AND EXTRACT(MONTH FROM r.date_naissance) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '1 day')
    AND EXTRACT(DAY   FROM r.date_naissance) = EXTRACT(DAY   FROM CURRENT_DATE + INTERVAL '1 day');

  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_count := v_count + v_tmp;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Commentaire ────────────────────────────────────────────
COMMENT ON FUNCTION fn_generer_alertes_anniversaires() IS
  'Génère les alertes anniversaires du jour et du lendemain (préavis 24h).
   Retourne le nombre d''alertes créées.
   À appeler chaque jour, ou depuis le bouton "Générer alertes anniversaires" de l''application.';

-- ── RLS sur les alertes (déjà couverte par 06_schema_updates.sql) ─
-- Les policies existantes s'appliquent au type ''anniversaire'' automatiquement.
