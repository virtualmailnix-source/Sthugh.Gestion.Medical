-- ============================================================
--  15_seed_fictif.sql
--  St Hugh's Anglican Home - Données fictives complètes
--  64 résidents + couverture de TOUS les modules de l'app
--
--  Prérequis : scripts 01 à 14 déjà exécutés
--  Médicaments utilisés : ceux insérés par 04_seed_data.sql
--  Pour remettre à zéro : exécuter 16_reboot_complet.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. MÉDECINS FICTIFS (5)
-- ============================================================
INSERT INTO doctors (titre, nom, prenom, specialite, telephone, clinique, jours_consultation, notes) VALUES
('Dr.', 'PERMALLOO', 'Suresh',    'Médecine Générale', '4641001', 'Clinique Rose Hill',  'Mardi, Vendredi',  'Médecin principal du foyer'),
('Dr.', 'BAPPOO',    'Meera',     'Gériatrie',         '4652002', 'Hôpital Victoria',    'Lundi, Mercredi',  'Spécialiste gériatrique - visites mardi AM'),
('Dr.', 'OOZEER',    'Farida',    'Cardiologie',       '4663003', 'Clinique Darné',       'Mardi, Vendredi',  NULL),
('Dr.', 'LABONNE',   'Guy',       'Neurologie',        '4674004', 'Cabinet Labonne PAMPLEMOUSSES', 'Mercredi, Samedi', NULL),
('Dr.', 'RAMSAMY',   'Priya',     'Médecine Interne',  '4685005', 'Hôpital SSRN',        'Lundi, Jeudi',     NULL);

-- ============================================================
-- 2. RÉSIDENTS FICTIFS (64)
-- Chambres 101–164. Anniversaires module : R-101 fête aujourd'hui
-- (2026-06-10), R-102 fête demain (2026-06-11)
-- ============================================================

-- ── 55 résidents actifs ────────────────────────────────────
INSERT INTO residents (
  numero_chambre, nom, prenom, date_naissance, sexe, date_entree,
  medecin_id, groupe_sanguin, allergies, conditions_chroniques,
  mobilite, niveau_priorite, notes_medicales, taille, actif
) VALUES
('101','LABONTE',      'Marie-Thérèse','1944-06-10','Féminin', '2020-01-10',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A+', 'Pénicilline',    'HTA, Arthrose',              'Assistance partielle', 3,'Douleurs articulaires le matin',          158.0, true),
('102','BOODHOO',      'Ramesh',       '1947-06-11','Masculin','2019-06-15',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'B+', NULL,             'Diabète T2, HTA',            'Fauteuil roulant',     2,'Insuline 2x/jour',                       171.5, true),
('103','OOZEER',       'Fatima',       '1952-11-08','Féminin', '2023-03-01',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'O+', 'Sulfamides',     NULL,                         'Autonome',             3,NULL,                                      155.0, true),
('104','LAGESSE',      'Pierre',       '1938-05-30','Masculin','2018-09-20',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'AB+',NULL,             'ICC, HTA, Fibrillation',     'Alitement',            1,'Surveillance cardiaque quotidienne',      165.0, true),
('105','LUTCHMANSINGH','Saraswati',    '1949-09-12','Féminin', '2021-04-18',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'A-', NULL,             'Ostéoporose, Hypothyroïdie', 'Assistance partielle', 2,'Calcium + Vit D quotidien',               152.0, true),
('106','RIVIERE',      'Jean-Claude',  '1935-12-04','Masculin','2017-11-05',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'O+', NULL,             'Alzheimer stade 2',          'Alitement',            1,'Surveillance constante requise',          168.0, true),
('107','RAMSAMY',      'Asha',         '1943-06-17','Féminin', '2020-08-22',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'B-', 'Ibuprofène',     'HTA, Glaucome',              'Assistance partielle', 2,'Collyre 2x/jour',                        160.0, true),
('108','BAPPOO',       'Hassan',       '1956-02-28','Masculin','2022-07-14',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A+', NULL,             'BPCO',                       'Autonome',             3,'Inhalateur si essoufflement',             175.0, true),
('109','NOEL',         'Brigitte',     '1940-10-03','Féminin', '2019-02-10',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'O-', NULL,             'Parkinson stade 2',          'Fauteuil roulant',     2,'Tremblement main droite',                157.0, true),
('110','BISSESSUR',    'Suresh',       '1951-04-19','Masculin','2021-10-30',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'B+', NULL,             'HTA',                        'Autonome',             3,NULL,                                      168.0, true),
('111','KHODABUX',     'Fatimah',      '1954-08-25','Féminin', '2022-01-17',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'A+', 'Aspirine',       'Diabète T2, Rétinopathie',   'Assistance partielle', 2,'Contrôle glycémie quotidien',             163.0, true),
('112','COLLEN',       'André',        '1942-01-11','Masculin','2020-05-06',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'O+', NULL,             'Arthrose lombaire',          'Fauteuil roulant',     3,NULL,                                      172.0, true),
('113','GOPAUL',       'Radha',        '1948-03-28','Féminin', '2021-07-19',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'AB-',NULL,             'HTA, Insuffisance veineuse', 'Assistance partielle', 3,NULL,                                      154.0, true),
('114','MAROT',        'Robert',       '1933-09-07','Masculin','2016-04-25',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'A+', NULL,             'Démence, Incontinence',      'Alitement',            1,'Port de couches - nuit',                  170.0, true),
('115','TEELUCK',      'Parvati',      '1946-06-14','Féminin', '2021-12-01',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'O+', NULL,             'HTA, Insuffisance rénale',   'Assistance partielle', 2,'Restriction hydrique 1,5L/j',             158.0, true),
('116','JAUNBOCCUS',   'Ali',          '1958-12-22','Masculin','2023-09-10',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'B+', NULL,             NULL,                         'Autonome',             3,'Nouveau résident - bilan initial à faire',168.0, true),
('117','JANVIER',      'Gisèle',       '1939-07-05','Féminin', '2018-03-14',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'A+', NULL,             'ICC, HTA',                   'Fauteuil roulant',     2,'Diurétiques le matin',                   161.0, true),
('118','RAMNARAIN',    'Vinod',        '1955-11-30','Masculin','2022-05-08',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'O+', NULL,             'Dyslipidémie, HTA',          'Autonome',             3,NULL,                                      174.0, true),
('119','CADERSA',      'Zohra',        '1950-04-02','Féminin', '2021-02-20',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'B+', 'Metronidazole',  'Ulcère gastrique, Anémie',   'Assistance partielle', 2,'Repas fractionnés 5x/jour',               156.0, true),
('120','ROUGET',       'Marcel',       '1931-08-16','Masculin','2015-09-01',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A-', NULL,             'Insuffisance rénale ch.',    'Alitement',            1,'Dialyse 3x/semaine - transport organisé', 167.0, true),
('121','BHOOKUN',      'Kamini',       '1944-02-09','Féminin', '2020-10-15',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'O+', NULL,             'Ostéoporose, Dépression',    'Assistance partielle', 3,'Suivi psychologique mensuel',             153.0, true),
('122','AH-KEE',       'James',        '1949-05-27','Masculin','2021-08-03',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'B+', NULL,             'Parkinson stade 1',          'Assistance partielle', 2,'Tremblements légers',                    167.0, true),
('123','MOONEAN',      'Anita',        '1941-10-18','Féminin', '2019-11-22',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'AB+',NULL,             'HTA, Fibrillation atriale',  'Fauteuil roulant',     2,'Anticoagulant - INR mensuel',            159.0, true),
('124','PILLAY',       'Serge',        '1957-03-14','Masculin','2023-01-05',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'O+', NULL,             'Diabète T2',                 'Autonome',             3,'Glycémie à surveiller',                  172.0, true),
('125','APPASAMY',     'Lata',         '1936-12-01','Féminin', '2016-07-18',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'A+', NULL,             'Alzheimer stade 3, HTA',     'Alitement',            1,'Alimentation assistée requise',           155.0, true),
('126','ALLYBOCUS',    'Yusuf',        '1953-06-09','Masculin','2022-03-25',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'B-', NULL,             'Cardiopathie ischémique',    'Assistance partielle', 2,'Éviter effort physique intense',          168.0, true),
('127','LAGESSE',      'Claudette',    '1945-09-21','Féminin', '2020-12-10',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'O+', NULL,             'HTA, Arthrose genou',        'Fauteuil roulant',     3,NULL,                                      157.0, true),
('128','JHUGROO',      'Sunil',        '1950-01-15','Masculin','2021-06-28',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A+', NULL,             'BPCO, Tabagisme sevré',      'Autonome',             3,'Spirométrie annuelle',                   169.0, true),
('129','PEEROO',       'Noor',         '1952-07-03','Féminin', '2022-09-12',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'B+', NULL,             'Diabète T2, HTA',            'Assistance partielle', 2,'Podologie mensuelle',                    161.0, true),
('130','LENOIR',       'Henri',        '1938-04-22','Masculin','2018-11-14',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'O+', NULL,             'AVC séquelles',              'Fauteuil roulant',     2,'Kinésithérapie 2x/semaine',              171.0, true),
('131','RAMFUL',       'Savitri',      '1943-08-30','Féminin', '2020-04-08',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'A-', NULL,             'HTA, Hypothyroïdie',         'Assistance partielle', 3,NULL,                                      154.0, true),
('132','WONG',         'Michel',       '1950-11-19','Masculin','2021-09-17',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'AB+',NULL,             'Dyslipidémie',               'Autonome',             3,NULL,                                      173.0, true),
('133','NAGESSUR',     'Sunita',       '1947-05-12','Féminin', '2021-03-05',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'O+', NULL,             'HTA, Glaucome',              'Assistance partielle', 2,'Pression oculaire à surveiller',          159.0, true),
('134','FONG',         'Antoine',      '1934-02-08','Masculin','2016-10-20',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'A+', NULL,             'Fibrillation atriale, ICC',  'Alitement',            1,'Monitoring cardiaque quotidien',          166.0, true),
('135','BEEHARRY',     'Geeta',        '1940-07-25','Féminin', '2019-05-12',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'B+', NULL,             'Alzheimer, HTA',             'Fauteuil roulant',     2,'Confusion fréquente - repères visuels',   158.0, true),
('136','RUGHOOBUR',    'Omar',         '1955-10-04','Masculin','2022-08-01',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'O+', NULL,             NULL,                         'Autonome',             3,NULL,                                      171.0, true),
('137','MARTIN',       'Louise',       '1946-04-15','Féminin', '2021-01-25',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A+', 'Codéine',        'Dépression, HTA',            'Assistance partielle', 3,'Suivi psychiatrique mensuel',             156.0, true),
('138','RAMDHONY',     'Deepak',       '1952-12-28','Masculin','2022-11-10',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'B+', NULL,             'Diabète T2, Neuropathie',    'Autonome',             3,'Examen pieds mensuel',                   170.0, true),
('139','HOSENALLY',    'Rashida',      '1958-03-17','Féminin', '2024-01-15',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'O+', NULL,             NULL,                         'Assistance partielle', 3,'Arrivée récente - bilans en cours',       163.0, true),
('140','CHOW',         'Fernand',      '1937-09-01','Masculin','2017-06-30',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'A-', NULL,             'Parkinson avancé, Démence',  'Alitement',            1,'Alimentation par sonde PEG',              164.0, true),
('141','MOONILAL',     'Indira',       '1942-05-20','Féminin', '2020-07-14',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'AB+',NULL,             'ICC, Fibrillation',          'Fauteuil roulant',     2,'Pesée quotidienne',                      162.0, true),
('142','LEE',          'Christophe',   '1954-01-06','Masculin','2022-04-19',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'O+', NULL,             'Dyslipidémie, HTA',          'Autonome',             3,NULL,                                      171.0, true),
('143','SEENEEVASSEN', 'Pushpa',       '1949-08-14','Féminin', '2021-05-03',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'B+', 'Sulfonylurées',  'Diabète T2, Rétinopathie',   'Assistance partielle', 2,'Glycémie à jeun quotidienne',             157.0, true),
('144','HENRY',        'Patrice',      '1933-11-22','Masculin','2016-08-15',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'A+', NULL,             'Insuffisance cardiaque',     'Alitement',            1,'Restriction sodée stricte',               168.0, true),
('145','HURREE',       'Sita',         '1945-03-09','Féminin', '2020-09-28',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'O-', NULL,             'HTA, Épilepsie',             'Fauteuil roulant',     2,'Éviter lumières stroboscopiques',         155.0, true),
('146','SAIB',         'Ismaïl',       '1956-07-18','Masculin','2023-02-20',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'B+', 'AINS',           'Ulcère gastrique',           'Autonome',             3,'Repas à heures fixes',                   169.0, true),
('147','DUVAL',        'Thérèse',      '1939-10-11','Féminin', '2018-12-03',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A+', NULL,             'Arthrose, Dépression',       'Fauteuil roulant',     3,NULL,                                      154.0, true),
('148','CALLIKAN',     'Ravi',         '1951-06-24','Masculin','2021-11-15',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'O+', NULL,             'Diabète T2, HTA',            'Autonome',             3,'Promenade quotidienne autorisée',         172.0, true),
('149','SULTAN',       'Aïcha',        '1953-02-16','Féminin', '2022-06-07',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'AB+',NULL,             'Insuffisance veineuse',      'Assistance partielle', 3,NULL,                                      160.0, true),
('150','DUPONT',       'Georges',      '1930-04-28','Masculin','2014-08-10',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'A+', NULL,             'Démence sévère, HTA, ICC',   'Alitement',            1,'Famille à informer si dégradation',       165.0, true),
('151','PERTAB',       'Vimla',        '1944-12-07','Féminin', '2020-03-22',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'O+', NULL,             'HTA, Diabète T2',            'Autonome',             3,NULL,                                      158.0, true),
('152','LAFLEUR',      'Emmanuel',     '1947-09-14','Masculin','2021-07-01',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'B+', NULL,             'Insuffisance rénale ch.',    'Fauteuil roulant',     2,'Créatinine à surveiller mensuel',         169.0, true),
('153','LUCKEENARAIN', 'Shanti',       '1950-06-21','Féminin', '2022-02-14',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'A-', NULL,             'HTA, Ostéoporose',           'Autonome',             3,NULL,                                      155.0, true),
('154','MARIE',        'Bernard',      '1936-01-03','Masculin','2017-05-18',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'O+', 'Warfarine',      'ICC, FA, AVC séquelles',     'Alitement',            1,'INR hebdomadaire obligatoire',            167.0, true),
('155','SEEGUM',       'Nalini',       '1941-11-28','Féminin', '2019-08-06',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'B+', NULL,             'Parkinson, Démence légère',  'Fauteuil roulant',     2,NULL,                                      153.0, true);

-- ── 4 résidents en vacances ───────────────────────────────
INSERT INTO residents (
  numero_chambre, nom, prenom, date_naissance, sexe, date_entree,
  medecin_id, groupe_sanguin, mobilite, niveau_priorite, taille, actif,
  statut_depart, date_sortie, date_retour_prevue, motif_sortie
) VALUES
('156','DOOKHY',    'Karim',     '1958-04-14','Masculin','2023-01-10',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'O+','Autonome',             3,168.0,true,'vacances',NOW()-INTERVAL '3 days',CURRENT_DATE+7, 'Visite famille à Port-Louis'),
('157','MOORABY',   'Leila',     '1952-08-05','Féminin', '2022-10-15',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'A+','Autonome',             3,162.0,true,'vacances',NOW()-INTERVAL '1 day', CURRENT_DATE+5, 'Séjour chez sa fille à Curepipe'),
('158','NANTOO',    'Raoul',     '1944-05-29','Masculin','2020-06-12',(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'B+','Assistance partielle', 2,167.0,true,'vacances',NOW()-INTERVAL '5 days',CURRENT_DATE+2, 'Vacances à Grand-Baie'),
('159','GHURBURRUN','Sunilduth', '1949-11-17','Masculin','2021-04-20',(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'O+','Autonome',             3,172.0,true,'vacances',NOW()-INTERVAL '2 days',CURRENT_DATE+4, 'Visite de son frère à Mahébourg');

-- ── 3 résidents partis définitivement ───────────────────
INSERT INTO residents (
  numero_chambre, nom, prenom, date_naissance, sexe, date_entree,
  medecin_id, groupe_sanguin, mobilite, niveau_priorite, taille, actif,
  statut_depart, date_sortie, motif_sortie
) VALUES
('160','RICAUD',   'Simone',   '1938-06-20','Féminin', '2017-09-14',(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),'A+','Fauteuil roulant',2,157.0,false,'depart','2026-04-15 10:30:00+04','Prise en charge par la famille à domicile'),
('161','MOHIT',    'Pradeep',  '1951-12-08','Masculin','2021-11-20',(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),'B+','Autonome',        3,170.0,false,'depart','2026-05-02 09:00:00+04','Transfert en EHPAD à Grand-Baie'),
('162','DOMINGUE', 'Celestine','1931-03-25','Féminin', '2015-02-10',(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'O-','Alitement',       1,155.0,false,'depart','2026-03-20 14:00:00+04','Décision familiale - retour au domicile du fils');

-- ── 2 résidents décédés ──────────────────────────────────
INSERT INTO residents (
  numero_chambre, nom, prenom, date_naissance, sexe, date_entree,
  medecin_id, groupe_sanguin, mobilite, niveau_priorite, taille, actif,
  statut_depart, date_sortie, motif_deces
) VALUES
('163','LEVEILLE','Francis','1942-08-12','Masculin','2018-04-16',(SELECT id FROM doctors WHERE nom='BAPPOO' LIMIT 1),'A+','Alitement',       1,168.0,false,'deces','2026-05-18 06:15:00+04','Arrêt cardiaque dans son sommeil'),
('164','BASTIEN', 'Angèle', '1935-01-07','Féminin', '2016-07-21',(SELECT id FROM doctors WHERE nom='OOZEER' LIMIT 1),'O+','Fauteuil roulant',2,152.0,false,'deces','2026-04-29 14:30:00+04','Pneumonie sévère - complication de grippe');

-- ============================================================
-- 3. CONTACTS FAMILLE (1–2 par résident)
-- ============================================================
INSERT INTO contacts_famille (resident_id, nom, telephone, relation, est_principal) VALUES
-- Actifs 101-115
((SELECT id FROM residents WHERE numero_chambre='101' LIMIT 1),'LABONTE Jean-Pierre','59012345','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='101' LIMIT 1),'LABONTE Carole',      '59023456','Belle-fille',false),
((SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),'BOODHOO Anita',       '59134567','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='103' LIMIT 1),'OOZEER Khalid',       '59245678','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),'LAGESSE Marie',       '59356789','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),'LAGESSE François',    '59367890','Fils',       false),
((SELECT id FROM residents WHERE numero_chambre='105' LIMIT 1),'LUTCHMANSINGH Ravi',  '59478901','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='106' LIMIT 1),'RIVIERE Monique',     '59589012','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),'RAMSAMY Priya',       '59690123','Nièce',      true),
((SELECT id FROM residents WHERE numero_chambre='108' LIMIT 1),'BAPPOO Salma',        '59701234','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='109' LIMIT 1),'NOEL Patrick',        '59812345','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='110' LIMIT 1),'BISSESSUR Rita',      '59923456','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='111' LIMIT 1),'KHODABUX Omar',       '59034567','Frère',      true),
((SELECT id FROM residents WHERE numero_chambre='112' LIMIT 1),'COLLEN Sophie',       '59145678','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='113' LIMIT 1),'GOPAUL Anish',        '59256789','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='114' LIMIT 1),'MAROT Claire',        '59367890','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='115' LIMIT 1),'TEELUCK Vikash',      '59478901','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='116' LIMIT 1),'JAUNBOCCUS Fatima',   '59589012','Épouse',     true),
-- Actifs 117-132
((SELECT id FROM residents WHERE numero_chambre='117' LIMIT 1),'JANVIER Claude',      '59690123','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='118' LIMIT 1),'RAMNARAIN Devi',      '59701234','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='119' LIMIT 1),'CADERSA Hassan',      '59812345','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='120' LIMIT 1),'ROUGET Lucie',        '59923456','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='121' LIMIT 1),'BHOOKUN Raj',         '59034567','Époux',      true),
((SELECT id FROM residents WHERE numero_chambre='122' LIMIT 1),'AH-KEE Linda',        '59145678','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='123' LIMIT 1),'MOONEAN Steve',       '59256789','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='124' LIMIT 1),'PILLAY Sunita',       '59367890','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='125' LIMIT 1),'APPASAMY Navin',      '59478901','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='126' LIMIT 1),'ALLYBOCUS Aziza',     '59589012','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='127' LIMIT 1),'LAGESSE Marc',        '59690123','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='128' LIMIT 1),'JHUGROO Kamla',       '59701234','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='129' LIMIT 1),'PEEROO Ali',          '59812345','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='130' LIMIT 1),'LENOIR Anne',         '59923456','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='131' LIMIT 1),'RAMFUL Suresh',       '59034567','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='132' LIMIT 1),'WONG Linda',          '59145678','Fille',      true),
-- Actifs 133-155
((SELECT id FROM residents WHERE numero_chambre='133' LIMIT 1),'NAGESSUR Raj',        '59256789','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),'FONG Marie',          '59367890','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='135' LIMIT 1),'BEEHARRY Vijay',      '59478901','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='136' LIMIT 1),'RUGHOOBUR Soraya',    '59589012','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='137' LIMIT 1),'MARTIN Robert',       '59690123','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='138' LIMIT 1),'RAMDHONY Priya',      '59701234','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='139' LIMIT 1),'HOSENALLY Aziz',      '59812345','Frère',      true),
((SELECT id FROM residents WHERE numero_chambre='140' LIMIT 1),'CHOW Lily',           '59923456','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='141' LIMIT 1),'MOONILAL Dev',        '59034567','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='142' LIMIT 1),'LEE Sophie',          '59145678','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),'SEENEEVASSEN Raj',    '59256789','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='144' LIMIT 1),'HENRY Sylvie',        '59367890','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='145' LIMIT 1),'HURREE Kumar',        '59478901','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='146' LIMIT 1),'SAIB Fatima',         '59589012','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='147' LIMIT 1),'DUVAL Henri',         '59690123','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='148' LIMIT 1),'CALLIKAN Sunita',     '59701234','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='149' LIMIT 1),'SULTAN Karim',        '59812345','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),'DUPONT Isabelle',     '59923456','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),'DUPONT Marc',         '59934567','Fils',       false),
((SELECT id FROM residents WHERE numero_chambre='151' LIMIT 1),'PERTAB Anil',         '59034567','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='152' LIMIT 1),'LAFLEUR Sophie',      '59145678','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='153' LIMIT 1),'LUCKEENARAIN Ram',    '59256789','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),'MARIE Claire',        '59367890','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='155' LIMIT 1),'SEEGUM Alvin',        '59478901','Fils',       true),
-- Vacances
((SELECT id FROM residents WHERE numero_chambre='156' LIMIT 1),'DOOKHY Amira',        '59589012','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='157' LIMIT 1),'MOORABY Fazila',      '59690123','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='158' LIMIT 1),'NANTOO Isabelle',     '59701234','Fille',      true),
((SELECT id FROM residents WHERE numero_chambre='159' LIMIT 1),'GHURBURRUN Raj',      '59812345','Frère',      true),
-- Partis
((SELECT id FROM residents WHERE numero_chambre='160' LIMIT 1),'RICAUD Paul',         '59923456','Fils',       true),
((SELECT id FROM residents WHERE numero_chambre='161' LIMIT 1),'MOHIT Sunita',        '59034567','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='162' LIMIT 1),'DOMINGUE Jacques',    '59145678','Fils',       true),
-- Décédés
((SELECT id FROM residents WHERE numero_chambre='163' LIMIT 1),'LEVEILLE Marie',      '59256789','Épouse',     true),
((SELECT id FROM residents WHERE numero_chambre='164' LIMIT 1),'BASTIEN Pierre',      '59367890','Fils',       true);

-- ============================================================
-- 4. TRAITEMENTS
-- Quelques traitements expirent dans <24h, <3j, <7j (pour les alertes)
-- Les traitements chroniques n'ont pas de date de fin
-- ============================================================
INSERT INTO traitements (
  resident_id, medicament_id, nom_medicament, dosage, posologie,
  date_debut, duree_jours, traitement_chronique, alerte_renouvellement, actif
) VALUES
-- Ch 101 - chronique HTA
((SELECT id FROM residents WHERE numero_chambre='101' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 comprimé le matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='101' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Paracetamol 500mg' LIMIT 1),'Paracetamol 500mg','500mg','1 cp matin et soir si douleur',CURRENT_DATE-30,30,false,true,true),

-- Ch 102 - EXPIRE DEMAIN (alerte_24h) + chronique insuline
((SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metformin 500mg' LIMIT 1),'Metformin 500mg','500mg','1 cp matin et soir',CURRENT_DATE-29,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Insulin NPH' LIMIT 1),'Insulin NPH','20 UI','20 UI sous-cutané 2x/jour',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 103 - aucun traitement (R-103 jamais vue - score priorité max)

-- Ch 104 - urgent ICC (expire aujourd'hui - alerte_24h)
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-30,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atorvastatin 40mg' LIMIT 1),'Atorvastatin 40mg','40mg','1 cp le soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 105 - expire dans 2 jours (alerte_3j)
((SELECT id FROM residents WHERE numero_chambre='105' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Levothyroxine 50mcg' LIMIT 1),'Levothyroxine 50mcg','50mcg','1 cp à jeun le matin',CURRENT_DATE-28,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='105' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Calcium 500mg' LIMIT 1),'Calcium 500mg','500mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 106 - chroniques Alzheimer
((SELECT id FROM residents WHERE numero_chambre='106' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Lorazepam 1mg' LIMIT 1),'Lorazepam 1mg','1mg','1 cp le soir',CURRENT_DATE-120,NULL,true,true,true),

-- Ch 107 - expire dans 5 jours (alerte_7j)
((SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atenolol 50mg' LIMIT 1),'Atenolol 50mg','50mg','1 cp matin',CURRENT_DATE-25,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Latanoprost 0.005%' LIMIT 1),'Latanoprost 0.005%','1 goutte','1 goutte/œil le soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 108 - BPCO
((SELECT id FROM residents WHERE numero_chambre='108' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Salbutamol inhaler' LIMIT 1),'Salbutamol inhaler','100mcg','2 bouffées si essoufflement',CURRENT_DATE-45,NULL,true,true,true),

-- Ch 109 - Parkinson
((SELECT id FROM residents WHERE numero_chambre='109' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Pregabalin 75mg' LIMIT 1),'Pregabalin 75mg','75mg','1 gélule matin et soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 110 - HTA simple
((SELECT id FROM residents WHERE numero_chambre='110' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Losartan 50mg' LIMIT 1),'Losartan 50mg','50mg','1 cp matin',CURRENT_DATE-60,NULL,true,true,true),

-- Ch 111 - Diabète + antibiotique qui EXPIRE DEMAIN
((SELECT id FROM residents WHERE numero_chambre='111' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Gliclazide 80mg' LIMIT 1),'Gliclazide 80mg','80mg','1 cp matin',CURRENT_DATE-29,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='111' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amoxicillin 500mg' LIMIT 1),'Amoxicillin 500mg','500mg','1 gélule 3x/jour',CURRENT_DATE-6,7,false,true,true),

-- Ch 112 - arthrose
((SELECT id FROM residents WHERE numero_chambre='112' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Diclofenac 50mg' LIMIT 1),'Diclofenac 50mg','50mg','1 cp matin et soir',CURRENT_DATE-14,30,false,true,true),

-- Ch 113 - HTA
((SELECT id FROM residents WHERE numero_chambre='113' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Enalapril 10mg' LIMIT 1),'Enalapril 10mg','10mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 114 - Démence sévère
((SELECT id FROM residents WHERE numero_chambre='114' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Haloperidol 5mg' LIMIT 1),'Haloperidol 5mg','5mg','1 cp soir',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 115 - HTA + IRC
((SELECT id FROM residents WHERE numero_chambre='115' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 10mg' LIMIT 1),'Amlodipine 10mg','10mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='115' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 116 - aucun traitement (nouveau résident, jamais vu)

-- Ch 117 - ICC + expire dans 3 jours (alerte_3j)
((SELECT id FROM residents WHERE numero_chambre='117' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-27,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='117' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atorvastatin 20mg' LIMIT 1),'Atorvastatin 20mg','20mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 118 - dyslipidémie
((SELECT id FROM residents WHERE numero_chambre='118' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Simvastatin 20mg' LIMIT 1),'Simvastatin 20mg','20mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='118' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Aspirin 75mg' LIMIT 1),'Aspirin 75mg','75mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 119 - ulcère + anémie (traitement ulcère EXPIRE DANS 1 JOUR)
((SELECT id FROM residents WHERE numero_chambre='119' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Omeprazole 20mg' LIMIT 1),'Omeprazole 20mg','20mg','1 gélule à jeun',CURRENT_DATE-29,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='119' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Ferrous Sulfate 200mg' LIMIT 1),'Ferrous Sulfate 200mg','200mg','1 cp matin',CURRENT_DATE-30,60,false,true,true),

-- Ch 120 - IRC dialyse
((SELECT id FROM residents WHERE numero_chambre='120' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='HCTZ 25mg' LIMIT 1),'HCTZ 25mg','25mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 121 - ostéoporose + dépression
((SELECT id FROM residents WHERE numero_chambre='121' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Sertraline 50mg' LIMIT 1),'Sertraline 50mg','50mg','1 cp matin',CURRENT_DATE-120,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='121' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Vitamin D3 1000IU' LIMIT 1),'Vitamin D3 1000IU','1000UI','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 122 - Parkinson stade 1 (expire dans 6 jours = alerte_7j)
((SELECT id FROM residents WHERE numero_chambre='122' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Pregabalin 75mg' LIMIT 1),'Pregabalin 75mg','75mg','1 gélule soir',CURRENT_DATE-24,30,false,true,true),

-- Ch 123 - FA + anticoagulant
((SELECT id FROM residents WHERE numero_chambre='123' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Warfarin 5mg' LIMIT 1),'Warfarin 5mg','5mg','1 cp selon INR',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='123' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atenolol 50mg' LIMIT 1),'Atenolol 50mg','50mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 124 - Diabète T2
((SELECT id FROM residents WHERE numero_chambre='124' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metformin 850mg' LIMIT 1),'Metformin 850mg','850mg','1 cp 2x/jour',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 125 - Alzheimer + HTA
((SELECT id FROM residents WHERE numero_chambre='125' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 126 - cardiopathie
((SELECT id FROM residents WHERE numero_chambre='126' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Aspirin 100mg' LIMIT 1),'Aspirin 100mg','100mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='126' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atorvastatin 40mg' LIMIT 1),'Atorvastatin 40mg','40mg','1 cp soir',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 127 - HTA
((SELECT id FROM residents WHERE numero_chambre='127' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Losartan 50mg' LIMIT 1),'Losartan 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 128 - BPCO
((SELECT id FROM residents WHERE numero_chambre='128' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Salbutamol inhaler' LIMIT 1),'Salbutamol inhaler','100mcg','2 bouffées matin et soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 129 - Diabète + HTA
((SELECT id FROM residents WHERE numero_chambre='129' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Glibenclamide 5mg' LIMIT 1),'Glibenclamide 5mg','5mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='129' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Enalapril 20mg' LIMIT 1),'Enalapril 20mg','20mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 130 - AVC séquelles
((SELECT id FROM residents WHERE numero_chambre='130' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Aspirin 100mg' LIMIT 1),'Aspirin 100mg','100mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='130' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atorvastatin 20mg' LIMIT 1),'Atorvastatin 20mg','20mg','1 cp soir',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 131 - HTA + hypothyroïdie
((SELECT id FROM residents WHERE numero_chambre='131' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Levothyroxine 100mcg' LIMIT 1),'Levothyroxine 100mcg','100mcg','1 cp à jeun',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='131' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metoprolol 50mg' LIMIT 1),'Metoprolol 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 132 - dyslipidémie
((SELECT id FROM residents WHERE numero_chambre='132' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Simvastatin 20mg' LIMIT 1),'Simvastatin 20mg','20mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 133 - HTA + glaucome (expire dans 4 jours = alerte_7j)
((SELECT id FROM residents WHERE numero_chambre='133' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 cp matin',CURRENT_DATE-26,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='133' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Timolol 0.5%' LIMIT 1),'Timolol 0.5%','1 goutte','1 goutte/œil 2x/jour',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 134 - FA + ICC urgent
((SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Warfarin 1mg' LIMIT 1),'Warfarin 1mg','selon INR','1 cp selon dosage INR',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 135 - Alzheimer
((SELECT id FROM residents WHERE numero_chambre='135' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Haloperidol 5mg' LIMIT 1),'Haloperidol 5mg','5mg','1 cp soir',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='135' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 136 - autonome, pas de traitement chronique
((SELECT id FROM residents WHERE numero_chambre='136' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Vitamin C 500mg' LIMIT 1),'Vitamin C 500mg','500mg','1 cp matin',CURRENT_DATE-30,60,false,true,true),

-- Ch 137 - dépression + HTA
((SELECT id FROM residents WHERE numero_chambre='137' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Sertraline 50mg' LIMIT 1),'Sertraline 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='137' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atenolol 50mg' LIMIT 1),'Atenolol 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 138 - Diabète neuropathie
((SELECT id FROM residents WHERE numero_chambre='138' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metformin 850mg' LIMIT 1),'Metformin 850mg','850mg','1 cp 2x/jour',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='138' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Pregabalin 75mg' LIMIT 1),'Pregabalin 75mg','75mg','1 gélule soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 139 - arrivée récente, pas encore de traitement

-- Ch 140 - Parkinson avancé
((SELECT id FROM residents WHERE numero_chambre='140' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Haloperidol 5mg' LIMIT 1),'Haloperidol 5mg','2.5mg','1/2 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='140' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Lorazepam 1mg' LIMIT 1),'Lorazepam 1mg','1mg','1 cp soir',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 141 - ICC
((SELECT id FROM residents WHERE numero_chambre='141' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='141' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atorvastatin 20mg' LIMIT 1),'Atorvastatin 20mg','20mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 142 - dyslipidémie HTA
((SELECT id FROM residents WHERE numero_chambre='142' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Simvastatin 20mg' LIMIT 1),'Simvastatin 20mg','20mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='142' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Enalapril 10mg' LIMIT 1),'Enalapril 10mg','10mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 143 - Diabète (expire dans 2 jours = alerte_3j)
((SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Gliclazide 80mg' LIMIT 1),'Gliclazide 80mg','80mg','1 cp matin',CURRENT_DATE-28,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metformin 500mg' LIMIT 1),'Metformin 500mg','500mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 144 - ICC urgent
((SELECT id FROM residents WHERE numero_chambre='144' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','2 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='144' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Aspirin 75mg' LIMIT 1),'Aspirin 75mg','75mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 145 - HTA + Épilepsie
((SELECT id FROM residents WHERE numero_chambre='145' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Losartan 50mg' LIMIT 1),'Losartan 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='145' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Diazepam 5mg' LIMIT 1),'Diazepam 5mg','5mg','1/2 cp si crise',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 146 - ulcère
((SELECT id FROM residents WHERE numero_chambre='146' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Omeprazole 40mg' LIMIT 1),'Omeprazole 40mg','40mg','1 gélule matin à jeun',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 147 - arthrose + dépression
((SELECT id FROM residents WHERE numero_chambre='147' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Paracetamol 1g' LIMIT 1),'Paracetamol 1g','1g','1 cp 3x/jour si douleur',CURRENT_DATE-14,30,false,true,true),
((SELECT id FROM residents WHERE numero_chambre='147' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Sertraline 50mg' LIMIT 1),'Sertraline 50mg','50mg','1 cp matin',CURRENT_DATE-120,NULL,true,true,true),

-- Ch 148 - Diabète HTA
((SELECT id FROM residents WHERE numero_chambre='148' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metformin 850mg' LIMIT 1),'Metformin 850mg','850mg','1 cp 2x/jour',CURRENT_DATE-60,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='148' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 cp matin',CURRENT_DATE-60,NULL,true,true,true),

-- Ch 149 - insuffisance veineuse
((SELECT id FROM residents WHERE numero_chambre='149' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Aspirin 75mg' LIMIT 1),'Aspirin 75mg','75mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Ch 150 - démence sévère (P1)
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Haloperidol 5mg' LIMIT 1),'Haloperidol 5mg','5mg','1 cp soir',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 10mg' LIMIT 1),'Amlodipine 10mg','10mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-180,NULL,true,true,true),

-- Ch 151–155
((SELECT id FROM residents WHERE numero_chambre='151' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Metformin 500mg' LIMIT 1),'Metformin 500mg','500mg','1 cp 2x/jour',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='152' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Losartan 50mg' LIMIT 1),'Losartan 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='153' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Warfarin 5mg' LIMIT 1),'Warfarin 5mg','5mg','1 cp selon INR',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','2 cp matin',CURRENT_DATE-180,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='155' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Lorazepam 1mg' LIMIT 1),'Lorazepam 1mg','1mg','1 cp soir',CURRENT_DATE-90,NULL,true,true,true),

-- Vacances (traitements en cours au moment du départ)
((SELECT id FROM residents WHERE numero_chambre='156' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Aspirin 75mg' LIMIT 1),'Aspirin 75mg','75mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),
((SELECT id FROM residents WHERE numero_chambre='158' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Atenolol 50mg' LIMIT 1),'Atenolol 50mg','50mg','1 cp matin',CURRENT_DATE-90,NULL,true,true,true),

-- Partis et décédés (historique traitements)
((SELECT id FROM residents WHERE numero_chambre='160' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Amlodipine 5mg' LIMIT 1),'Amlodipine 5mg','5mg','1 cp matin',CURRENT_DATE-365,NULL,false,false,false),
((SELECT id FROM residents WHERE numero_chambre='163' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Furosemide 40mg' LIMIT 1),'Furosemide 40mg','40mg','1 cp matin',CURRENT_DATE-180,NULL,false,false,false),
((SELECT id FROM residents WHERE numero_chambre='164' LIMIT 1),(SELECT id FROM medicaments WHERE nom_commercial='Prednisolone 20mg' LIMIT 1),'Prednisolone 20mg','20mg','1 cp matin',CURRENT_DATE-60,21,false,false,false);

-- ============================================================
-- 5. CONSULTATIONS
-- R-103, R-116, R-139 : jamais vus → score priorité max
-- R-107, R-124, R-143, R-150 : dernière > 30 jours → alerte
-- ============================================================
INSERT INTO consultations (
  resident_id, medecin_id, date_consultation,
  motif, tension_arterielle, temperature, pouls, poids, taille,
  saturation_o2, observations, diagnostic, prochain_rdv
) VALUES
-- Consultations récentes (< 14 jours)
((SELECT id FROM residents WHERE numero_chambre='101' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '3 days','Visite de routine','130/80',36.8,72,62.0,158.0,98,'Arthrose stable, HTA contrôlée','HTA, Arthrose genou',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '7 days','Suivi diabète','145/90',37.0,80,78.5,171.5,97,'Glycémie 8.2 mmol/L - ajuster insuline','Diabète T2 déséquilibré',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '2 days','Contrôle ICC','110/70',36.5,68,59.0,165.0,95,'Œdèmes membres inférieurs modérés','ICC - classe NYHA II',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='105' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '5 days','Suivi thyroïde','125/75',36.7,70,54.0,152.0,99,'Bilan thyroïdien correct, ostéoporose stable','Hypothyroïdie compensée',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='106' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '4 days','Suivi Alzheimer','120/80',36.9,75,65.0,168.0,96,'Désorientation modérée, famille informée','Alzheimer stade 2 - stable',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='108' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '1 day', 'Dyspnée légère','130/85',37.1,82,80.0,175.0,94,'Auscultation : sibilants légers','BPCO exacerbation légère',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='109' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '6 days','Suivi Parkinson','115/70',36.6,68,55.0,157.0,98,'Tremblement inchangé, kinésithérapie utile','Parkinson stade 2 - stable',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='110' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '8 days','Contrôle HTA','128/78',36.5,74,74.0,168.0,99,'HTA bien contrôlée sous traitement','HTA essentielle - équilibrée',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='111' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()-INTERVAL '3 days','Infection urinaire','135/85',37.8,88,60.0,163.0,97,'BU positive, antibiotique débuté','Infection urinaire basse',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='112' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '10 days','Lombalgies aiguës','140/82',36.7,76,79.0,172.0,98,'Douleurs lombaires L4-L5','Arthrose lombaire exacerbée',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='113' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '12 days','Visite routine','132/80',36.6,72,56.0,154.0,99,'RAS','HTA, Insuffisance veineuse - stable',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='114' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '5 days','Agitation nocturne','118/72',36.8,80,65.0,170.0,97,'Agitation nocturne accrue','Démence - ajuster haloperidol',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='115' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()-INTERVAL '9 days','Bilan rénal','130/82',36.5,70,57.0,158.0,98,'Créatinine 148 µmol/L - stable','IRC stade 3 - stable',CURRENT_DATE+30),

-- Consultations moyennes (15–29 jours)
((SELECT id FROM residents WHERE numero_chambre='117' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '18 days','Essoufflements','118/75',36.8,72,58.0,161.0,96,'Œdèmes réduits - diurétique efficace','ICC contrôlée',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='118' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '20 days','Bilan lipidique','128/80',36.5,70,78.0,174.0,99,'Cholestérol 5.8 mmol/L - traitement maintenu','Dyslipidémie',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='119' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()-INTERVAL '15 days','Douleurs épigastriques','120/75',36.7,68,49.0,156.0,98,'Gastroscopie à programmer','Ulcère gastrique',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='120' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '22 days','Dialyse - suivi','100/65',36.5,65,57.0,167.0,95,'Dialyse bien tolérée','IRC terminale - dialysé',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='121' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '14 days','Suivi dépression','120/76',36.6,70,52.0,153.0,99,'Humeur améliorée sous sertraline','Dépression - rémission partielle',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='122' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '16 days','Tremblement aggravé','125/78',36.7,72,69.0,167.0,98,'Tremblements bilatéraux maintenant','Parkinson stade 1-2 - progression',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='123' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()-INTERVAL '14 days','INR mensuel','135/85',36.5,75,62.0,159.0,97,'INR 2.4 - dans la cible','FA anticoagulée - équilibrée',CURRENT_DATE+30),

-- Consultations anciennes >30 jours (déclenchent alerte pas_vu_30j)
((SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()-INTERVAL '38 days','Dernière consultation','140/88',36.9,80,63.0,160.0,96,'Glaucome stable, HTA non optimale','HTA, Glaucome',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='124' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '55 days','Bilan diabète','148/90',37.0,82,80.0,172.0,97,'Glycémie à jeun 9.8 - revoir metformine','Diabète T2 déséquilibré',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '42 days','Suivi diabète','135/82',36.8,75,56.0,157.0,98,'Rétinopathie stable - ophtalmo à voir','Diabète T2 rétinopathie',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '65 days','Agitation','105/68',36.7,72,58.0,165.0,95,'Démence très avancée, grabataire','Démence sévère - fin de vie',CURRENT_DATE+7),

-- Quelques autres pour diversifier
((SELECT id FROM residents WHERE numero_chambre='125' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '7 days','Alimentation','108/70',36.5,68,46.0,155.0,96,'Poids stable sous alimentation assistée','Alzheimer stade 3',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='126' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '11 days','Cardio suivi','120/75',36.6,65,71.0,168.0,97,'ECG stable, douleurs thoraciques absentes','Cardiopathie ischémique - stable',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='130' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '6 days','Rééducation','125/80',36.7,74,72.0,171.0,98,'Progrès kiné - marche avec aide','AVC séquelles - amélioration',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '4 days','ICC urgence','100/65',37.2,95,64.0,166.0,90,'Décompensation cardiaque - hospitalisation évitée','ICC décompensée',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='140' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '5 days','Parkinson avancé','105/68',36.6,70,52.0,164.0,96,'Rigidité musculaire totale','Parkinson terminal',CURRENT_DATE+14),
((SELECT id FROM residents WHERE numero_chambre='144' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '3 days','Contrôle ICC','102/65',36.8,78,61.0,168.0,93,'Surcharge hydrique réduite sous furosémide','ICC - amélioration lente',CURRENT_DATE+7),
((SELECT id FROM residents WHERE numero_chambre='148' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '8 days','Diabète HTA','138/85',36.7,78,77.0,172.0,97,'Glycémie correcte, HTA bien contrôlée','Diabète T2 + HTA - équilibrés',CURRENT_DATE+30),
((SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '2 days','INR urgent','108/68',36.5,68,59.0,167.0,95,'INR 4.8 - trop élevé, ajuster warfarine','FA ICC - surdosage warfarine',CURRENT_DATE+7),
-- Décédés (historique)
((SELECT id FROM residents WHERE numero_chambre='163' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'2026-05-15 10:00:00+04','Dernière visite avant décès','95/60',38.2,88,51.0,168.0,88,'Altération état général sévère','ICC terminale',NULL),
((SELECT id FROM residents WHERE numero_chambre='164' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'2026-04-25 09:30:00+04','Pneumonie sévère','105/70',39.1,110,44.0,152.0,84,'Pneumonie bilatérale','Pneumonie sévère',NULL);

-- ============================================================
-- 6. RENDEZ-VOUS (module rendez-vous + urgences)
-- ============================================================
INSERT INTO rendez_vous (resident_id, medecin_id, date_rdv, motif, statut, est_urgence, duree_minutes) VALUES
-- À venir (planifiés)
((SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()+INTERVAL '2 days','Suivi diabète - ajustement insuline','planifie',false,30),
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()+INTERVAL '1 day', 'URGENCE - œdèmes aggravés','planifie',true,20),
((SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()+INTERVAL '3 days','Rattrapage visite - non vue depuis 38j','planifie',false,30),
((SELECT id FROM residents WHERE numero_chambre='111' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()+INTERVAL '4 days','Contrôle antibiothérapie IU','planifie',false,20),
((SELECT id FROM residents WHERE numero_chambre='115' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()+INTERVAL '5 days','Bilan rénal trimestriel','planifie',false,30),
((SELECT id FROM residents WHERE numero_chambre='122' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()+INTERVAL '7 days','Réévaluation Parkinson','planifie',false,45),
((SELECT id FROM residents WHERE numero_chambre='124' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()+INTERVAL '2 days','Urgence glycémie - non vu 55j','planifie',true,20),
((SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()+INTERVAL '1 day', 'Contrôle post-décompensation ICC','planifie',true,30),
((SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()+INTERVAL '3 days','Rattrapage - non vue 42j','planifie',false,30),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()+INTERVAL '4 days','Famille présente - évaluation soins palliatifs','planifie',false,60),
((SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()+INTERVAL '1 day', 'Contrôle INR surdosage','planifie',true,20),
-- Passés (effectués / absent)
((SELECT id FROM residents WHERE numero_chambre='110' LIMIT 1),(SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),NOW()-INTERVAL '8 days','Contrôle HTA','effectue',false,20),
((SELECT id FROM residents WHERE numero_chambre='113' LIMIT 1),(SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),NOW()-INTERVAL '12 days','Routine','effectue',false,20),
((SELECT id FROM residents WHERE numero_chambre='136' LIMIT 1),(SELECT id FROM doctors WHERE nom='RAMSAMY'   LIMIT 1),NOW()-INTERVAL '5 days','Bilan initial','effectue',false,30),
((SELECT id FROM residents WHERE numero_chambre='155' LIMIT 1),(SELECT id FROM doctors WHERE nom='LABONNE'   LIMIT 1),NOW()-INTERVAL '30 days','Parkinson','absent',false,30),
((SELECT id FROM residents WHERE numero_chambre='128' LIMIT 1),(SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),NOW()-INTERVAL '15 days','BPCO','effectue',false,20);

-- ============================================================
-- 7. ALERTES (types: medicament_24h, pas_vu_30j, urgence, autre)
-- ============================================================
INSERT INTO alertes (type, resident_id, titre, message, priorite, lue, traitee) VALUES
-- Médicaments expirant bientôt
('medicament_24h',(SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),'Metformin 500mg - expire demain','Le traitement Metformin 500mg de BOODHOO Ramesh (Ch.102) expire le '||(CURRENT_DATE+1)::TEXT||'.',1,false,false),
('medicament_24h',(SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),'Furosemide 40mg - expire aujourd''hui','Le traitement Furosemide 40mg de LAGESSE Pierre (Ch.104) expire aujourd''hui.',1,false,false),
('medicament_24h',(SELECT id FROM residents WHERE numero_chambre='111' LIMIT 1),'Amoxicillin 500mg - expire demain','Antibiotique KHODABUX Fatimah (Ch.111) - à renouveler ou arrêter selon avis médical.',1,false,false),
('medicament_24h',(SELECT id FROM residents WHERE numero_chambre='119' LIMIT 1),'Omeprazole 20mg - expire demain','Traitement ulcère CADERSA Zohra (Ch.119) à renouveler.',1,false,false),
-- Résidents non vus depuis >30j
('pas_vu_30j',   (SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),'RAMSAMY Asha - non vue depuis 38 jours','Dernière consultation : '||(CURRENT_DATE-38)::TEXT||'. À planifier en priorité.',2,false,false),
('pas_vu_30j',   (SELECT id FROM residents WHERE numero_chambre='124' LIMIT 1),'PILLAY Serge - non vu depuis 55 jours','Dernière consultation : '||(CURRENT_DATE-55)::TEXT||'. Glycémie préoccupante.',1,false,false),
('pas_vu_30j',   (SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),'SEENEEVASSEN Pushpa - non vue depuis 42 jours','Dernière consultation : '||(CURRENT_DATE-42)::TEXT||'. Diabète à surveiller.',2,false,false),
('pas_vu_30j',   (SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),'DUPONT Georges - non vu depuis 65 jours','Dernière consultation : '||(CURRENT_DATE-65)::TEXT||'. État préoccupant.',1,false,false),
-- Jamais vus
('visite_requise',(SELECT id FROM residents WHERE numero_chambre='103' LIMIT 1),'OOZEER Fatima - aucune consultation enregistrée','Résidente depuis 2023-03-01 sans consultation. Bilan initial requis.',1,false,false),
('visite_requise',(SELECT id FROM residents WHERE numero_chambre='116' LIMIT 1),'JAUNBOCCUS Ali - aucune consultation enregistrée','Nouveau résident (2023-09-10) sans bilan initial.',1,false,false),
('visite_requise',(SELECT id FROM residents WHERE numero_chambre='139' LIMIT 1),'HOSENALLY Rashida - aucune consultation enregistrée','Arrivée 2024-01-15. Bilans en cours non finalisés.',2,false,false),
-- Urgences
('urgence',      (SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),'FONG Antoine - décompensation cardiaque','Décompensation ICC détectée. Médecin contacté. Surveillance renforcée.',1,false,false),
('urgence',      (SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),'MARIE Bernard - surdosage Warfarine','INR 4.8 - risque hémorragique. Dr. OOZEER prévenu. Arrêt warfarine.',1,false,false),
-- Autre
('autre',        NULL,'Médecin de garde 12 juin 2026','Dr. PERMALLOO assure la permanence ce week-end. Tel : 4641001.',3,false,false),
('autre',        (SELECT id FROM residents WHERE numero_chambre='120' LIMIT 1),'ROUGET Marcel - transport dialyse vendredi','Rappel : ambulance confirmée vendredi 8h pour dialyse hôpital.',3,true,true);

-- ============================================================
-- 8. PLANNING VISITES + PLANIFICATION
-- ============================================================
INSERT INTO planning_visites (date_visite, medecin_id, heure_debut, heure_fin, nb_max, statut, notes)
VALUES
(CURRENT_DATE+1, (SELECT id FROM doctors WHERE nom='PERMALLOO' LIMIT 1),'08:00','12:00',12,'planifie','Visite urgences prioritaires'),
(CURRENT_DATE+3, (SELECT id FROM doctors WHERE nom='BAPPOO'    LIMIT 1),'09:00','12:00',10,'planifie','Suivi diabétiques + gériatrie'),
(CURRENT_DATE+7, (SELECT id FROM doctors WHERE nom='OOZEER'    LIMIT 1),'08:30','12:30',12,'planifie','Suivi cardiologiques + routine');

-- Résidents assignés aux créneaux
INSERT INTO planning_residents (planning_id, resident_id, ordre, statut) VALUES
-- Slot 1 (demain - Dr. Permalloo)
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+1 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),1,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+1 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='124' LIMIT 1),2,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+1 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='154' LIMIT 1),3,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+1 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='120' LIMIT 1),4,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+1 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='103' LIMIT 1),5,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+1 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='116' LIMIT 1),6,'planifie'),
-- Slot 2 (dans 3 jours - Dr. Bappoo)
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+3 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='102' LIMIT 1),1,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+3 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='107' LIMIT 1),2,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+3 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='143' LIMIT 1),3,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+3 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='125' LIMIT 1),4,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+3 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='129' LIMIT 1),5,'planifie'),
-- Slot 3 (dans 7 jours - Dr. Oozeer)
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+7 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='134' LIMIT 1),1,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+7 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='144' LIMIT 1),2,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+7 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),3,'planifie'),
((SELECT id FROM planning_visites WHERE date_visite=CURRENT_DATE+7 LIMIT 1),(SELECT id FROM residents WHERE numero_chambre='139' LIMIT 1),4,'planifie');

-- ============================================================
-- 9. VISITES FAMILLES
-- ============================================================
INSERT INTO visites (
  resident_id, visiteur_nom, visiteur_prenom, visiteur_telephone, visiteur_relation,
  nb_personnes, autres_visiteurs, date_visite, heure_arrivee, heure_depart,
  est_planifiee, statut, notes
) VALUES
-- Visite en cours
((SELECT id FROM residents WHERE numero_chambre='101' LIMIT 1),'LABONTE','Jean-Pierre','59012345','Fils',          3,'[{"nom":"LABONTE","prenom":"Carole"},{"nom":"LABONTE","prenom":"Léo"}]',CURRENT_DATE,NOW()-INTERVAL '30 min',NULL,false,'en_cours','Anniversaire de la résidente aujourd''hui'),
-- Visites planifiées
((SELECT id FROM residents WHERE numero_chambre='104' LIMIT 1),'LAGESSE','Marie','59356789','Épouse',              1,'[]',                                                                       CURRENT_DATE+1,NULL,NULL,true,'planifiee','Épouse vient tous les 2 jours'),
((SELECT id FROM residents WHERE numero_chambre='125' LIMIT 1),'APPASAMY','Navin','59478901','Fils',              2,'[{"nom":"APPASAMY","prenom":"Priya"}]',                                     CURRENT_DATE+2,NULL,NULL,true,'planifiee',NULL),
((SELECT id FROM residents WHERE numero_chambre='150' LIMIT 1),'DUPONT','Isabelle','59923456','Fille',            2,'[{"nom":"DUPONT","prenom":"Marc"}]',                                        CURRENT_DATE+4,NULL,NULL,true,'planifiee','Réunion famille + soins palliatifs'),
-- Visites terminées récemment
((SELECT id FROM residents WHERE numero_chambre='110' LIMIT 1),'BISSESSUR','Rita','59923456','Fille',             1,'[]',                                                                       CURRENT_DATE-1,NOW()-INTERVAL '2 days'-INTERVAL '2 hours',NOW()-INTERVAL '2 days'-INTERVAL '30 min',false,'terminee',NULL),
((SELECT id FROM residents WHERE numero_chambre='114' LIMIT 1),'MAROT','Claire','59367890','Fille',               3,'[{"nom":"MAROT","prenom":"Paul"},{"nom":"MAROT","prenom":"Julie"}]',        CURRENT_DATE-2,NOW()-INTERVAL '3 days'-INTERVAL '3 hours',NOW()-INTERVAL '3 days'-INTERVAL '1 hour',true,'terminee','Famille très inquiète'),
((SELECT id FROM residents WHERE numero_chambre='122' LIMIT 1),'AH-KEE','Linda','59145678','Fille',               1,'[]',                                                                       CURRENT_DATE-3,NOW()-INTERVAL '4 days'-INTERVAL '2 hours',NOW()-INTERVAL '4 days'-INTERVAL '1 hour',false,'terminee',NULL),
((SELECT id FROM residents WHERE numero_chambre='130' LIMIT 1),'LENOIR','Anne','59923456','Fille',                2,'[{"nom":"LENOIR","prenom":"Paul"}]',                                        CURRENT_DATE-5,NOW()-INTERVAL '6 days'-INTERVAL '2 hours',NOW()-INTERVAL '6 days'-INTERVAL '30 min',false,'terminee','Ravi des progrès kiné'),
-- Visite annulée
((SELECT id FROM residents WHERE numero_chambre='135' LIMIT 1),'BEEHARRY','Vijay','59478901','Fils',              1,'[]',                                                                       CURRENT_DATE-1,NULL,NULL,true,'annulee','Annulée - fils malade');

-- ============================================================
-- 10. HISTORIQUE SORTIES (vacances précédentes)
-- ============================================================
INSERT INTO historique_sorties (
  resident_id, date_sortie, date_retour, date_retour_prevue, motif_sortie
) VALUES
-- R-158 Raoul NANTOO : était déjà parti en vacances avant
((SELECT id FROM residents WHERE numero_chambre='158' LIMIT 1),'2025-12-22','2026-01-05','2026-01-07','Noël en famille à Floréal'),
((SELECT id FROM residents WHERE numero_chambre='158' LIMIT 1),'2026-03-10','2026-03-17','2026-03-17','Vacances à Flic-en-Flac'),
-- R-156 Karim DOOKHY : première sortie
((SELECT id FROM residents WHERE numero_chambre='156' LIMIT 1),'2025-08-14','2025-08-21','2025-08-20','Vacances familiales'),
-- R-157 Leila MOORABY
((SELECT id FROM residents WHERE numero_chambre='157' LIMIT 1),'2025-12-25','2026-01-02','2026-01-03','Fêtes de fin d''année chez sa fille'),
-- Résident actif (R-108) qui était parti en vacances et est revenu
((SELECT id FROM residents WHERE numero_chambre='108' LIMIT 1),'2025-09-01','2025-09-08','2025-09-10','Vacances à Trou d''Eau Douce');

-- ============================================================
-- 11. COURSES (résidents autonomes - sorties commissions)
-- ============================================================
INSERT INTO courses (
  resident_id, date_sortie, heure_depart, heure_retour, est_rentre, articles, notes
) VALUES
-- Dehors en ce moment
((SELECT id FROM residents WHERE numero_chambre='132' LIMIT 1),CURRENT_DATE,'09:30',NULL,false,'Pain, lait, journaux','Commission hebdomadaire'),
((SELECT id FROM residents WHERE numero_chambre='148' LIMIT 1),CURRENT_DATE,'10:00',NULL,false,'Médicaments pharmacie Curepipe','Ordonnance préparée'),
-- Rentrés aujourd'hui
((SELECT id FROM residents WHERE numero_chambre='110' LIMIT 1),CURRENT_DATE,'08:00','09:15',true,'Courrier, journaux','Rentré à l''heure'),
((SELECT id FROM residents WHERE numero_chambre='136' LIMIT 1),CURRENT_DATE,'08:30','09:45',true,'Effets personnels, cartes postales',NULL),
-- Sorties passées
((SELECT id FROM residents WHERE numero_chambre='108' LIMIT 1),CURRENT_DATE-2,'09:00','10:30',true,'Vêtements, chaussures','Bien supporté'),
((SELECT id FROM residents WHERE numero_chambre='118' LIMIT 1),CURRENT_DATE-3,'10:00','11:30',true,'Journaux, fruits',NULL),
((SELECT id FROM residents WHERE numero_chambre='128' LIMIT 1),CURRENT_DATE-4,'09:15','10:45',true,'Livres, magazines',NULL),
((SELECT id FROM residents WHERE numero_chambre='142' LIMIT 1),CURRENT_DATE-1,'09:00','10:30',true,'Pain, fromage, eau minérale',NULL),
((SELECT id FROM residents WHERE numero_chambre='146' LIMIT 1),CURRENT_DATE-5,'10:30','12:00',true,'Articles hygiène, snacks',NULL),
((SELECT id FROM residents WHERE numero_chambre='151' LIMIT 1),CURRENT_DATE-2,'08:45','10:00',true,'Fleurs pour chambre, café',NULL);

-- ============================================================
-- 12. VÉRIFICATION FINALE
-- ============================================================
SELECT
  'doctors'           AS module,  COUNT(*) AS total FROM doctors
UNION ALL SELECT 'residents',                          COUNT(*) FROM residents
UNION ALL SELECT 'residents actifs',                   COUNT(*) FROM residents WHERE actif=true AND statut_depart IS NULL
UNION ALL SELECT 'residents vacances',                 COUNT(*) FROM residents WHERE statut_depart='vacances'
UNION ALL SELECT 'residents partis',                   COUNT(*) FROM residents WHERE statut_depart='depart'
UNION ALL SELECT 'residents décédés',                  COUNT(*) FROM residents WHERE statut_depart='deces'
UNION ALL SELECT 'contacts_famille',                   COUNT(*) FROM contacts_famille
UNION ALL SELECT 'traitements',                        COUNT(*) FROM traitements
UNION ALL SELECT 'consultations',                      COUNT(*) FROM consultations
UNION ALL SELECT 'rendez_vous',                        COUNT(*) FROM rendez_vous
UNION ALL SELECT 'alertes',                            COUNT(*) FROM alertes
UNION ALL SELECT 'planning_visites',                   COUNT(*) FROM planning_visites
UNION ALL SELECT 'planning_residents',                 COUNT(*) FROM planning_residents
UNION ALL SELECT 'visites_familles',                   COUNT(*) FROM visites
UNION ALL SELECT 'historique_sorties',                 COUNT(*) FROM historique_sorties
UNION ALL SELECT 'courses',                            COUNT(*) FROM courses
ORDER BY module;

COMMIT;
