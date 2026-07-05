-- ============================================================
--  20_traitements_stock.sql
--  St Hugh's Anglican Home - Stock & ravitaillement des traitements
--
--  Principe : le stock restant est RECALCULÉ À LA VOLÉE dans la vue
--  (pas de cron) à partir du stock saisi et de la consommation/jour :
--    conso/jour        = dose_par_prise × prises_par_jour
--    stock restant     = stock saisi − conso/jour × jours écoulés
--    autonomie (jours) = ⌊stock restant ÷ conso/jour⌋
--    date épuisement   = aujourd'hui + autonomie
--    date ravitaillement = épuisement − marge de sécurité (défaut 7 j)
--  Fallback : si le conditionnement est inconnu, date_fin_estimee
--  saisie manuellement alimente les mêmes statuts.
--
--  À exécuter APRÈS 19_cin_residents.sql.
-- ============================================================

-- ── 1. Colonnes ──────────────────────────────────────────────
ALTER TABLE traitements
  ADD COLUMN IF NOT EXISTS dose_par_prise       NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS prises_par_jour      NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS unite                VARCHAR(20)
    CHECK (unite IS NULL OR unite IN ('comprimé','sachet','ml')),
  ADD COLUMN IF NOT EXISTS unites_par_plaquette INTEGER,
  ADD COLUMN IF NOT EXISTS plaquettes_par_boite INTEGER,
  ADD COLUMN IF NOT EXISTS stock_initial_unites NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS date_stock           DATE,        -- date du stock saisi / dernier réappro
  ADD COLUMN IF NOT EXISTS marge_securite_jours INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS date_fin_estimee     DATE;        -- fallback conditionnement inconnu

-- ── 2. Vue recréée avec les calculs de stock ─────────────────
DROP VIEW IF EXISTS v_traitements_actifs;
CREATE VIEW v_traitements_actifs AS
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
  -- Statut alerte (durée de prescription)
  CASE
    WHEN t.date_fin IS NULL OR t.traitement_chronique = TRUE THEN 'chronique'
    WHEN t.date_fin < CURRENT_DATE                           THEN 'expire'
    WHEN t.date_fin = CURRENT_DATE                           THEN 'expire_aujourd_hui'
    WHEN t.date_fin <= CURRENT_DATE + 1                      THEN 'alerte_24h'
    WHEN t.date_fin <= CURRENT_DATE + 3                      THEN 'alerte_3j'
    WHEN t.date_fin <= CURRENT_DATE + 7                      THEN 'alerte_7j'
    ELSE 'ok'
  END            AS statut_alerte,
  -- Stock
  k.conso_par_jour,
  k.stock_restant,
  k.autonomie_jours,
  COALESCE(
    CASE WHEN k.autonomie_jours IS NOT NULL THEN CURRENT_DATE + k.autonomie_jours END,
    t.date_fin_estimee
  ) AS date_epuisement,
  COALESCE(
    CASE WHEN k.autonomie_jours IS NOT NULL THEN CURRENT_DATE + k.autonomie_jours END,
    t.date_fin_estimee
  ) - COALESCE(t.marge_securite_jours, 7) AS date_ravitaillement,
  CASE
    WHEN k.autonomie_jours IS NOT NULL THEN
      CASE
        WHEN k.stock_restant <= 0 OR k.autonomie_jours < 2                THEN 'rouge'
        WHEN k.autonomie_jours <= COALESCE(t.marge_securite_jours, 7)     THEN 'orange'
        ELSE 'vert'
      END
    WHEN t.date_fin_estimee IS NOT NULL THEN
      CASE
        WHEN t.date_fin_estimee - CURRENT_DATE < 2                            THEN 'rouge'
        WHEN t.date_fin_estimee - CURRENT_DATE <= COALESCE(t.marge_securite_jours, 7) THEN 'orange'
        ELSE 'vert'
      END
    ELSE NULL
  END AS statut_stock
FROM traitements t
JOIN residents r ON r.id = t.resident_id
LEFT JOIN doctors d ON d.id = t.prescrit_par
LEFT JOIN LATERAL (
  SELECT
    conso.v AS conso_par_jour,
    restant.v AS stock_restant,
    CASE WHEN restant.v IS NOT NULL AND conso.v > 0
         THEN FLOOR(restant.v / conso.v)::INTEGER END AS autonomie_jours
  FROM
    (SELECT CASE WHEN t.dose_par_prise > 0 AND t.prises_par_jour > 0
                 THEN t.dose_par_prise * t.prises_par_jour END AS v) conso,
    (SELECT CASE WHEN t.stock_initial_unites IS NOT NULL
                  AND t.dose_par_prise > 0 AND t.prises_par_jour > 0
                 THEN GREATEST(
                   0,
                   t.stock_initial_unites
                   - (t.dose_par_prise * t.prises_par_jour)
                     * GREATEST(0, CURRENT_DATE - COALESCE(t.date_stock, t.date_debut))
                 ) END AS v) restant
) k ON TRUE;

-- Respecter la RLS des tables sous-jacentes (voir 17)
ALTER VIEW v_traitements_actifs SET (security_invoker = on);

-- ── 3. RPC réapprovisionnement ───────────────────────────────
-- Ajoute X boîtes (ou X unités) au stock RESTANT actuel et repart
-- d'aujourd'hui. Pour les chroniques, le cycle continue sans fin.
CREATE OR REPLACE FUNCTION fn_reapprovisionner(
  p_traitement_id UUID,
  p_boites  INTEGER DEFAULT NULL,
  p_unites  NUMERIC DEFAULT NULL
) RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  t RECORD;
  v_restant NUMERIC;
  v_ajout   NUMERIC;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid() AND actif = TRUE
      AND role IN ('super_admin','admin')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT * INTO t FROM traitements WHERE id = p_traitement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Traitement introuvable'; END IF;

  -- Stock restant actuel (même formule que la vue)
  IF t.stock_initial_unites IS NOT NULL AND t.dose_par_prise > 0 AND t.prises_par_jour > 0 THEN
    v_restant := GREATEST(
      0,
      t.stock_initial_unites
      - (t.dose_par_prise * t.prises_par_jour)
        * GREATEST(0, CURRENT_DATE - COALESCE(t.date_stock, t.date_debut))
    );
  ELSE
    v_restant := 0;
  END IF;

  -- Ajout en unités : soit direct, soit boîtes × plaquettes × unités
  IF p_unites IS NOT NULL AND p_unites > 0 THEN
    v_ajout := p_unites;
  ELSIF p_boites IS NOT NULL AND p_boites > 0
        AND COALESCE(t.unites_par_plaquette, 0) > 0
        AND COALESCE(t.plaquettes_par_boite, 0) > 0 THEN
    v_ajout := p_boites * t.plaquettes_par_boite * t.unites_par_plaquette;
  ELSE
    RAISE EXCEPTION 'Quantité invalide (boîtes avec conditionnement connu, ou unités)';
  END IF;

  UPDATE traitements
     SET stock_initial_unites = v_restant + v_ajout,
         date_stock = CURRENT_DATE
   WHERE id = p_traitement_id;

  RETURN v_restant + v_ajout;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_reapprovisionner(UUID, INTEGER, NUMERIC) TO authenticated;

-- ── 4. Exemple de contrôle ───────────────────────────────────
-- 2 cp/jour pendant 10 jours → 20 cp requis. Plaquette de 5 cp,
-- boîte de 2 plaquettes (10 cp) → 2 boîtes. Avec 1 boîte en stock :
-- stock 10 cp, autonomie ⌊10/2⌋ = 5 j → épuisement à J+5,
-- statut orange dès que autonomie ≤ marge (7 j par défaut) donc
-- immédiatement, rouge à partir de J+4 (autonomie < 2).
