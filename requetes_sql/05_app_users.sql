-- ============================================================
--  05 - App Users & Authentification
--  Exécuter en 5e dans Supabase SQL Editor
--  SuperAdmin : accès complet
--  Admin      : lecture + saisie consultations/traitements/RDV
-- ============================================================

CREATE TABLE IF NOT EXISTS app_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('super_admin','admin')),
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  actif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- Fonction: rôle de l'utilisateur courant (SECURITY DEFINER pour bypasser RLS)
CREATE OR REPLACE FUNCTION fn_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM app_users
  WHERE auth_user_id = auth.uid() AND actif = TRUE
  LIMIT 1;
$$;

-- Fonction: est-ce un super_admin ?
CREATE OR REPLACE FUNCTION fn_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND actif = TRUE
  );
$$;

-- Fonction: est-ce un utilisateur actif (n'importe quel rôle) ?
CREATE OR REPLACE FUNCTION fn_is_app_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid() AND actif = TRUE
  );
$$;

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_users_select" ON app_users
  FOR SELECT TO authenticated USING (fn_is_app_user());

CREATE POLICY "app_users_modify" ON app_users
  FOR ALL TO authenticated
  USING (fn_is_super_admin()) WITH CHECK (fn_is_super_admin());

-- ============================================================
-- ÉTAPES POUR CRÉER LE PREMIER SUPER ADMIN
-- ============================================================
-- 1. Supabase Dashboard → Authentication → Users → Add user
--    (entrez email + mot de passe du super admin)
-- 2. Notez l'UUID affiché pour cet utilisateur
-- 3. Exécutez la requête ci-dessous (remplacez les valeurs) :
--
-- INSERT INTO app_users (auth_user_id, role, nom, prenom)
-- VALUES ('<UUID-de-auth.users>', 'super_admin', 'Dupont', 'Jean');
--
-- Pour ajouter un admin (infirmière, etc.) :
-- INSERT INTO app_users (auth_user_id, role, nom, prenom)
-- VALUES ('<UUID>', 'admin', 'Martin', 'Sophie');
-- ============================================================
