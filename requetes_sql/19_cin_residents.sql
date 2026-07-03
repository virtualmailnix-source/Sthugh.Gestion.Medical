-- ============================================================
--  19_cin_residents.sql
--  St Hugh's Anglican Home — Champ CIN (carte d'identité) résident
--
--  Format mauricien : 14 caractères alphanumériques, commence
--  par une lettre. NULL accepté pour les résidents existants ;
--  le formulaire de l'application rend le champ obligatoire.
--
--  À exécuter APRÈS 18_contacts_email.sql.
-- ============================================================

ALTER TABLE residents ADD COLUMN IF NOT EXISTS cin VARCHAR(14);

ALTER TABLE residents DROP CONSTRAINT IF EXISTS residents_cin_format;
ALTER TABLE residents ADD CONSTRAINT residents_cin_format
  CHECK (cin IS NULL OR cin ~ '^[A-Za-z][A-Za-z0-9]{13}$');

-- ── Recréer les vues qui figent r.* à leur création ─────────
-- (sinon la nouvelle colonne cin n'y apparaît pas)

DROP VIEW IF EXISTS v_residents_priorite;
CREATE VIEW v_residents_priorite AS
SELECT
  r.*,
  d.nom        AS medecin_nom,
  d.prenom     AS medecin_prenom,
  d.titre      AS medecin_titre,
  d.telephone  AS medecin_telephone,
  -- Dernière consultation
  c.date_consultation AS derniere_consultation,
  CASE
    WHEN c.date_consultation IS NULL THEN NULL
    ELSE (CURRENT_DATE - c.date_consultation::date)
  END AS jours_sans_consultation,
  -- Traitements urgents
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
  -- Score de priorité
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
  SELECT date_consultation FROM consultations
  WHERE resident_id = r.id
  ORDER BY date_consultation DESC LIMIT 1
) c ON TRUE;

-- Respecter la RLS de residents (voir 17)
ALTER VIEW v_residents_priorite SET (security_invoker = on);

-- Vue publique : le CIN est une donnée d'identité, pas médicale
DROP VIEW IF EXISTS v_residents_public;
CREATE VIEW v_residents_public AS
SELECT
  id, numero_chambre, nom, prenom, cin, date_naissance, sexe,
  date_entree, photo_url, actif,
  statut_depart, date_sortie, date_retour_prevue, motif_sortie,
  created_at
FROM residents
WHERE fn_is_app_user();

GRANT SELECT ON v_residents_public TO authenticated;
