-- ============================================================
-- 13_courses_historique.sql
-- A. historique_sorties — archive des séjours vacances
-- B. courses           — sorties commissions (résidents autonomes)
-- ============================================================

-- ── A. historique_sorties ────────────────────────────────────
-- Enregistre chaque séjour vacances : date départ + date retour réel

CREATE TABLE IF NOT EXISTS historique_sorties (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id         UUID         NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  date_sortie         TIMESTAMPTZ,
  date_retour         TIMESTAMPTZ  DEFAULT now(),
  date_retour_prevue  DATE,
  motif_sortie        TEXT,
  created_at          TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hsorties_resident ON historique_sorties(resident_id);
CREATE INDEX IF NOT EXISTS idx_hsorties_date     ON historique_sorties(date_sortie DESC);

ALTER TABLE historique_sorties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hs_select" ON historique_sorties
  FOR SELECT TO authenticated USING (fn_is_app_user());

CREATE POLICY "hs_insert" ON historique_sorties
  FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());

CREATE POLICY "hs_delete" ON historique_sorties
  FOR DELETE TO authenticated USING (fn_is_super_admin());


-- ── B. courses ───────────────────────────────────────────────
-- Sorties commissions pour résidents autonomes (mobilite = 'Autonome')

CREATE TABLE IF NOT EXISTS courses (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id   UUID    NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  date_sortie   DATE    NOT NULL DEFAULT CURRENT_DATE,
  heure_depart  TIME,
  heure_retour  TIME,
  est_rentre    BOOLEAN DEFAULT false,
  articles      TEXT,
  notes         TEXT,
  created_by    UUID    REFERENCES app_users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_courses_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION fn_courses_updated_at();

CREATE INDEX IF NOT EXISTS idx_courses_resident   ON courses(resident_id);
CREATE INDEX IF NOT EXISTS idx_courses_date       ON courses(date_sortie DESC);
CREATE INDEX IF NOT EXISTS idx_courses_est_rentre ON courses(est_rentre);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select" ON courses
  FOR SELECT TO authenticated USING (fn_is_app_user());

CREATE POLICY "courses_insert" ON courses
  FOR INSERT TO authenticated WITH CHECK (fn_is_app_user());

CREATE POLICY "courses_update" ON courses
  FOR UPDATE TO authenticated
  USING (fn_is_app_user()) WITH CHECK (fn_is_app_user());

CREATE POLICY "courses_delete" ON courses
  FOR DELETE TO authenticated USING (fn_is_super_admin());


-- ── Vérification rapide ──────────────────────────────────────
SELECT 'historique_sorties' AS table_name, COUNT(*) FROM historique_sorties
UNION ALL
SELECT 'courses',                           COUNT(*) FROM courses;
