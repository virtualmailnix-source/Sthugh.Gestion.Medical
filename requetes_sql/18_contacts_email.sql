-- ============================================================
--  18_contacts_email.sql
--  St Hugh's Anglican Home - Email sur les contacts famille
--
--  Champ optionnel : affiché en lien mailto: dans l'application.
--  (La table doctors possède déjà une colonne email.)
--
--  À exécuter APRÈS 17_role_receptionniste.sql.
-- ============================================================

ALTER TABLE contacts_famille ADD COLUMN IF NOT EXISTS email VARCHAR(200);
