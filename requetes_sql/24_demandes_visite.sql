-- ============================================================
--  24_demandes_visite.sql
--  St Hugh's Anglican Home — Demandes de visite en ligne
--
--  Flux : site public → Edge Function visit-request (webhook
--  sécurisé, insertion en service role) → validation/refus par
--  le personnel (Réceptionniste, Admin, Super Admin) → création
--  d'une visite familiale liée au résident choisi.
--
--  À exécuter APRÈS 23_audit_global.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS demandes_visite (
  id                  UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  demandeur_prenom    VARCHAR(100) NOT NULL,
  demandeur_nom       VARCHAR(100) NOT NULL,
  demandeur_email     VARCHAR(200) NOT NULL,
  demandeur_telephone VARCHAR(30)  NOT NULL,
  -- Nom du résident tel que tapé par le visiteur : le rapprochement
  -- avec un vrai dossier est fait par le personnel, jamais par le public
  resident_saisi      VARCHAR(200) NOT NULL,
  lien_parente        VARCHAR(100),
  resident_id         UUID REFERENCES residents(id) ON DELETE SET NULL,
  date_visite         DATE         NOT NULL,
  creneau             VARCHAR(20)  NOT NULL CHECK (creneau IN ('matin','apres_midi')),
  nb_visiteurs        INTEGER      DEFAULT 1 CHECK (nb_visiteurs BETWEEN 1 AND 6),
  message             TEXT,
  statut              VARCHAR(20)  DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','validee','refusee')),
  motif_refus         TEXT,
  traite_par          UUID REFERENCES app_users(id) ON DELETE SET NULL,
  traite_le           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes_visite(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_date   ON demandes_visite(date_visite);
CREATE INDEX IF NOT EXISTS idx_demandes_email  ON demandes_visite(demandeur_email);

ALTER TABLE demandes_visite ENABLE ROW LEVEL SECURITY;

-- Lecture et traitement par tout le personnel actif (3 rôles).
-- Pas de policy INSERT : seule l'Edge Function (service role,
-- qui contourne la RLS) peut créer une demande.
DROP POLICY IF EXISTS "dv_read"   ON demandes_visite;
DROP POLICY IF EXISTS "dv_update" ON demandes_visite;
CREATE POLICY "dv_read" ON demandes_visite
  FOR SELECT TO authenticated USING (fn_is_app_user());
CREATE POLICY "dv_update" ON demandes_visite
  FOR UPDATE TO authenticated USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());

-- Journal d'activité : chaque validation/refus tracé avec son auteur
DROP TRIGGER IF EXISTS trg_audit_demandes_visite ON demandes_visite;
CREATE TRIGGER trg_audit_demandes_visite
  AFTER INSERT OR UPDATE OR DELETE ON demandes_visite
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
