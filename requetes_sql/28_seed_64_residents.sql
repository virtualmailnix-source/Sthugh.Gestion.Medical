-- ============================================================
--  28_seed_64_residents.sql
--  St Hugh's Anglican Home - 64 résidents fictifs générés
--
--  Contenu :
--    - 5 médecins fictifs
--    - 64 résidents (chambres 101-164), générés par
--      generate_series : identité mauricienne, CIN valide
--      (^[A-Za-z][A-Za-z0-9]{13}$), groupe sanguin, mobilité,
--      priorité cohérente avec la mobilité, taille, allergies
--    - Répartition : 56 actifs, 4 en vacances, 2 départs
--      définitifs, 2 décès (via UPDATE pour passer par le
--      trigger trg_resident_deces, comme en production)
--    - Anniversaires : chambre 101 fête AUJOURD'HUI,
--      chambre 102 fête DEMAIN (module anniversaires)
--    - 1 contact famille principal par résident (avec email)
--
--  Prérequis : SQL 01 à 26 exécutés, base vidée par
--  27_reboot_complet_v2.sql. Les triggers d'audit sont coupés
--  le temps du seed pour ne pas remplir le journal, puis remis.
--
--  À EXÉCUTER depuis le Supabase SQL Editor (projet MÉDICAL).
-- ============================================================

BEGIN;

-- ── 0. Couper l'audit le temps du seed ───────────────────────
ALTER TABLE doctors          DISABLE TRIGGER trg_audit_doctors;
ALTER TABLE residents        DISABLE TRIGGER trg_audit_residents;
ALTER TABLE contacts_famille DISABLE TRIGGER trg_audit_contacts_famille;

-- ── 1. Médecins fictifs (5) ──────────────────────────────────
INSERT INTO doctors (titre, nom, prenom, specialite, telephone, clinique, jours_consultation, notes) VALUES
('Dr.', 'PERMALLOO', 'Suresh', 'Médecine Générale', '4641001', 'Clinique Rose Hill',  'Mardi, Vendredi',  'Médecin principal du foyer'),
('Dr.', 'BAPPOO',    'Meera',  'Gériatrie',         '4652002', 'Hôpital Victoria',    'Lundi, Mercredi',  'Spécialiste gériatrique'),
('Dr.', 'OOZEER',    'Farida', 'Cardiologie',       '4663003', 'Clinique Darné',      'Mardi, Vendredi',  NULL),
('Dr.', 'LABONNE',   'Guy',    'Neurologie',        '4674004', 'Cabinet Labonne Pamplemousses', 'Mercredi, Samedi', NULL),
('Dr.', 'RAMSAMY',   'Priya',  'Médecine Interne',  '4685005', 'Hôpital SSRN',        'Lundi, Jeudi',     NULL);

-- ── 2. 64 résidents générés (chambres 101-164) ───────────────
-- La combinaison nom (cycle 32) x prénom (cycle 13, premier) x
-- sexe (alterné) garantit 64 identités distinctes.
WITH params AS (
  SELECT
    ARRAY['APPADOO','BABOORAM','BHUJUN','CHELLEN','DHUNNOO','ETIENNE','FANCHETTE','GERMAIN',
          'HYPOLITE','ISIDORE','JOLICOEUR','KISTNEN','LUTCHMUN','MOOTOOSAMY','NARAINSAMY','OLIVIER',
          'PADARUTH','QUIRIN','RAMJUTTUN','SOOKUN','TEELUCK','VEERASAMY','AZIE','BONNELAME',
          'CLAIRICIA','DESIRE','FIGARO','GENTIL','LAROSE','MERLE','PERRINE','ROSE']::text[]      AS noms,
    ARRAY['Marie-Claire','Devika','Shameem','Josiane','Kalawatee','Lisette','Bibi','Monique',
          'Padma','Rose-May','Sandhya','Thérèse','Urmila']::text[]                               AS prenoms_f,
    ARRAY['Ahmad','Bernard','Chandra','Dev','Eddy','France','Gérard','Hemraj','Iqbal',
          'Jocelyn','Krishna','Louis','Mahen']::text[]                                           AS prenoms_m,
    ARRAY['O+','A+','B+','O+','A-','AB+','B-','O-']::text[]                                      AS groupes,
    ARRAY[NULL,'Pénicilline',NULL,NULL,'Aspirine',NULL,'Sulfamides',NULL]::text[]                AS allergies_l,
    ARRAY['HTA','Diabète T2, HTA','Arthrose',NULL,'HTA, Glaucome','Ostéoporose',
          'Diabète T2','BPCO',NULL,'Parkinson stade 1, HTA']::text[]                             AS conditions_l,
    ARRAY['Autonome','Assistance partielle','Fauteuil roulant',
          'Autonome','Assistance partielle','Alitement']::text[]                                 AS mobilites
),
docs AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nom) AS rn FROM doctors
)
INSERT INTO residents (
  numero_chambre, nom, prenom, date_naissance, sexe, date_entree,
  medecin_id, groupe_sanguin, cin, allergies, conditions_chroniques,
  mobilite, niveau_priorite, taille, actif
)
SELECT
  (100 + i)::text,
  p.noms[1 + ((i - 1) % 32)],
  CASE WHEN i % 2 = 1
       THEN p.prenoms_f[1 + (((i - 1) / 2) % 13)]
       ELSE p.prenoms_m[1 + (((i - 1) / 2) % 13)] END,
  make_date(1932 + ((i * 7) % 27), 1 + ((i * 5) % 12), 1 + ((i * 3) % 28)),
  CASE WHEN i % 2 = 1 THEN 'Féminin' ELSE 'Masculin' END,
  CURRENT_DATE - ((60 + i * 53) % 3000),
  d.id,
  p.groupes[1 + (i % 8)],
  substr(p.noms[1 + ((i - 1) % 32)], 1, 1)
    || to_char(make_date(1932 + ((i * 7) % 27), 1 + ((i * 5) % 12), 1 + ((i * 3) % 28)), 'DDMMYY')
    || lpad(((i * 137) % 10000000)::text, 7, '0'),
  p.allergies_l[1 + (i % 8)],
  p.conditions_l[1 + (i % 10)],
  p.mobilites[1 + (i % 6)],
  CASE 1 + (i % 6) WHEN 6 THEN 1 WHEN 3 THEN 2 WHEN 5 THEN 2 ELSE 3 END,
  148 + ((i * 7) % 18) + CASE WHEN i % 2 = 0 THEN 12 ELSE 0 END,
  true
FROM params p
CROSS JOIN generate_series(1, 64) AS i
JOIN docs d ON d.rn = 1 + (i % 5);

-- ── 3. Anniversaires pour le module dédié ────────────────────
-- Ch 101 fête aujourd'hui, ch 102 fête demain (années
-- bissextiles 1944/1948 pour survivre à un 29 février)
UPDATE residents
   SET date_naissance = make_date(1944,
         EXTRACT(MONTH FROM CURRENT_DATE)::int,
         EXTRACT(DAY   FROM CURRENT_DATE)::int)
 WHERE numero_chambre = '101';

UPDATE residents
   SET date_naissance = make_date(1948,
         EXTRACT(MONTH FROM CURRENT_DATE + 1)::int,
         EXTRACT(DAY   FROM CURRENT_DATE + 1)::int)
 WHERE numero_chambre = '102';

-- ── 4. Statuts de départ (mêmes proportions que le seed 15) ──

-- 4 en vacances (retour prévu dans 2 à 5 jours)
UPDATE residents
   SET statut_depart      = 'vacances',
       date_sortie        = NOW() - ((numero_chambre::int - 156) || ' days')::interval,
       date_retour_prevue = CURRENT_DATE + (162 - numero_chambre::int),
       motif_sortie       = 'Séjour en famille'
 WHERE numero_chambre IN ('157','158','159','160');

-- 2 départs définitifs
UPDATE residents
   SET statut_depart = 'depart', actif = false,
       date_sortie   = NOW() - INTERVAL '40 days',
       motif_sortie  = 'Retour au domicile familial'
 WHERE numero_chambre = '161';

UPDATE residents
   SET statut_depart = 'depart', actif = false,
       date_sortie   = NOW() - INTERVAL '18 days',
       motif_sortie  = 'Transfert vers un autre établissement'
 WHERE numero_chambre = '162';

-- 2 décès : l'UPDATE déclenche trg_resident_deces
-- (priorité NULL, actif false, traitements/alertes/RDV soldés)
UPDATE residents
   SET statut_depart = 'deces',
       date_sortie   = NOW() - INTERVAL '25 days',
       motif_deces   = 'Arrêt cardiaque dans son sommeil'
 WHERE numero_chambre = '163';

UPDATE residents
   SET statut_depart = 'deces',
       date_sortie   = NOW() - INTERVAL '9 days',
       motif_deces   = 'Complications d''une pneumonie'
 WHERE numero_chambre = '164';

-- ── 5. Un contact famille principal par résident ─────────────
INSERT INTO contacts_famille (resident_id, nom, telephone, relation, email, est_principal)
SELECT
  r.id,
  r.nom || ' ' || (ARRAY['Jean','Priya','Marc','Anita','Paul','Devi','Cédric','Reshma'])[1 + (r.numero_chambre::int % 8)],
  '5' || lpad(((r.numero_chambre::int * 91237) % 10000000)::text, 7, '0'),
  (ARRAY['Fils','Fille','Neveu','Nièce'])[1 + (r.numero_chambre::int % 4)],
  lower(regexp_replace(r.nom, '[^A-Za-z]', '', 'g')) || '.' || r.numero_chambre || '@example.mu',
  true
FROM residents r
WHERE r.numero_chambre::int BETWEEN 101 AND 164;

-- ── 6. Remettre l'audit ──────────────────────────────────────
ALTER TABLE doctors          ENABLE TRIGGER trg_audit_doctors;
ALTER TABLE residents        ENABLE TRIGGER trg_audit_residents;
ALTER TABLE contacts_famille ENABLE TRIGGER trg_audit_contacts_famille;

-- ── 7. Vérification ──────────────────────────────────────────
-- Attendu : 64 résidents (56 sans statut, 4 vacances, 2 depart,
-- 2 deces), 5 médecins, 64 contacts, 0 ligne d'audit ajoutée.
SELECT COALESCE(statut_depart, 'actif (aucun)') AS statut,
       COUNT(*) AS residents
FROM residents
GROUP BY statut_depart
UNION ALL SELECT 'TOTAL residents',   COUNT(*) FROM residents
UNION ALL SELECT 'doctors',           COUNT(*) FROM doctors
UNION ALL SELECT 'contacts_famille',  COUNT(*) FROM contacts_famille
UNION ALL SELECT 'audit_log (doit rester vide)', COUNT(*) FROM audit_log
ORDER BY statut;

COMMIT;
