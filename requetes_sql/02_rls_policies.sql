-- ============================================================
-- Row Level Security - St Hugh's Medical System
-- ============================================================

ALTER TABLE doctors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicaments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE traitements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous       ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_visites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet           ENABLE ROW LEVEL SECURITY;

-- Accès complet via clé anon (usage interne maison de retraite)
CREATE POLICY "rls_doctors_all"            ON doctors            FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_residents_all"          ON residents          FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_medicaments_all"        ON medicaments        FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_traitements_all"        ON traitements        FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_consultations_all"      ON consultations      FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_rdv_all"                ON rendez_vous        FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_alertes_all"            ON alertes            FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_planning_visites_all"   ON planning_visites   FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_planning_residents_all" ON planning_residents FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rls_cabinet_all"            ON cabinet            FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
