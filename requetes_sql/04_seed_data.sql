-- ============================================================
-- Données initiales - St Hugh's Anglican Home
-- Rose Hill, Mauritius
-- ============================================================

-- ── Paramètres du cabinet ───────────────────────────────────
INSERT INTO cabinet (nom, adresse, telephone, jours_visites, entete_ordonnance)
VALUES (
  'St Hugh''s Anglican Home',
  'Rose Hill, Mauritius',
  '4641124',
  'Mardi, Vendredi',
  'St Hugh''s Anglican Home
Rose Hill, Mauritius
Tél: 4641124'
) ON CONFLICT DO NOTHING;

-- ── Médecins exemples ───────────────────────────────────────
INSERT INTO doctors (titre, nom, prenom, specialite, telephone, clinique, jours_consultation) VALUES
('Dr.', 'RAMDHANY',   'Anand',    'Médecine Générale',     '4641234', 'Clinique Rose Hill', 'Mardi, Vendredi'),
('Dr.', 'FOOLCHAND',  'Priya',    'Gériatrie',             '4652345', 'Hôpital Victoria',   'Lundi, Jeudi'),
('Dr.', 'ISSACK',     'Mohamed',  'Médecine Interne',      '4663456', 'Cabinet Dr. Issack', 'Mercredi, Samedi');

-- ── Médicaments courants (Mauritius) ────────────────────────
INSERT INTO medicaments (nom_commercial, nom_generique, forme, dosage_standard, classe) VALUES
-- Cardiovasculaires / HTA
('Amlodipine 5mg',       'Amlodipine',           'Comprimé', '5mg',     'Inhibiteur calcique'),
('Amlodipine 10mg',      'Amlodipine',           'Comprimé', '10mg',    'Inhibiteur calcique'),
('Enalapril 10mg',       'Énalapril',            'Comprimé', '10mg',    'IEC'),
('Enalapril 20mg',       'Énalapril',            'Comprimé', '20mg',    'IEC'),
('Losartan 50mg',        'Losartan potassique',  'Comprimé', '50mg',    'ARA II'),
('Atenolol 50mg',        'Aténolol',             'Comprimé', '50mg',    'Bêtabloquant'),
('Metoprolol 50mg',      'Métoprolol',           'Comprimé', '50mg',    'Bêtabloquant'),
('HCTZ 25mg',            'Hydrochlorothiazide',  'Comprimé', '25mg',    'Diurétique thiazidique'),
('Furosemide 40mg',      'Furosémide',           'Comprimé', '40mg',    'Diurétique'),
('Aspirin 75mg',         'Acide acétylsalicylique','Comprimé','75mg',   'Antiagrégant plaquettaire'),
('Aspirin 100mg',        'Acide acétylsalicylique','Comprimé','100mg',  'Antiagrégant plaquettaire'),
('Atorvastatin 20mg',    'Atorvastatine',        'Comprimé', '20mg',    'Statine'),
('Atorvastatin 40mg',    'Atorvastatine',        'Comprimé', '40mg',    'Statine'),
('Simvastatin 20mg',     'Simvastatine',         'Comprimé', '20mg',    'Statine'),

-- Diabète
('Metformin 500mg',      'Metformine',           'Comprimé', '500mg',   'Biguanide'),
('Metformin 850mg',      'Metformine',           'Comprimé', '850mg',   'Biguanide'),
('Glibenclamide 5mg',    'Glibenclamide',        'Comprimé', '5mg',     'Sulfonylurée'),
('Glipizide 5mg',        'Glipizide',            'Comprimé', '5mg',     'Sulfonylurée'),
('Gliclazide 80mg',      'Gliclazide',           'Comprimé', '80mg',    'Sulfonylurée'),
('Insulin NPH',          'Insuline isophane',    'Injectable','100UI/ml','Insuline'),
('Insulin Actrapid',     'Insuline humaine',     'Injectable','100UI/ml','Insuline'),

-- Analgésiques / Antiinflammatoires
('Paracetamol 500mg',    'Paracétamol',          'Comprimé', '500mg',   'Analgésique'),
('Paracetamol 1g',       'Paracétamol',          'Comprimé', '1g',      'Analgésique'),
('Ibuprofen 400mg',      'Ibuprofène',           'Comprimé', '400mg',   'AINS'),
('Diclofenac 50mg',      'Diclofénac',           'Comprimé', '50mg',    'AINS'),
('Tramadol 50mg',        'Tramadol',             'Gélule',   '50mg',    'Analgésique opioïde'),

-- Antibiotiques
('Amoxicillin 500mg',    'Amoxicilline',         'Gélule',   '500mg',   'Pénicilline'),
('Amoxicillin 1g',       'Amoxicilline',         'Comprimé', '1g',      'Pénicilline'),
('Augmentin 625mg',      'Amox + Ac. Clavulanique','Comprimé','625mg',  'Pénicilline + inhibiteur'),
('Ciprofloxacin 500mg',  'Ciprofloxacine',       'Comprimé', '500mg',   'Fluoroquinolone'),
('Metronidazole 400mg',  'Métronidazole',        'Comprimé', '400mg',   'Nitro-imidazolé'),
('Cotrimoxazole 960mg',  'SMX + TMP',            'Comprimé', '960mg',   'Sulfonamide'),
('Doxycycline 100mg',    'Doxycycline',          'Gélule',   '100mg',   'Tétracycline'),
('Azithromycin 500mg',   'Azithromycine',        'Comprimé', '500mg',   'Macrolide'),

-- Gastro-entérologie
('Omeprazole 20mg',      'Oméprazole',           'Gélule',   '20mg',    'IPP'),
('Omeprazole 40mg',      'Oméprazole',           'Gélule',   '40mg',    'IPP'),
('Lansoprazole 30mg',    'Lansoprazole',         'Gélule',   '30mg',    'IPP'),
('Metoclopramide 10mg',  'Métoclopramide',       'Comprimé', '10mg',    'Antiémétique'),
('ORS sachets',          'SRO',                  'Sachet',   '',        'Réhydratation'),

-- Neurologie / Psychiatrie
('Lorazepam 1mg',        'Lorazépam',            'Comprimé', '1mg',     'Benzodiazépine'),
('Diazepam 5mg',         'Diazépam',             'Comprimé', '5mg',     'Benzodiazépine'),
('Sertraline 50mg',      'Sertraline',           'Comprimé', '50mg',    'ISRS'),
('Haloperidol 5mg',      'Halopéridol',          'Comprimé', '5mg',     'Antipsychotique'),
('Pregabalin 75mg',      'Prégabaline',          'Gélule',   '75mg',    'Anticonvulsivant'),

-- Thyroïde
('Levothyroxine 50mcg',  'Lévothyroxine',        'Comprimé', '50mcg',   'Hormone thyroïdienne'),
('Levothyroxine 100mcg', 'Lévothyroxine',        'Comprimé', '100mcg',  'Hormone thyroïdienne'),

-- Vitamines / Suppléments
('Vitamin C 500mg',      'Acide ascorbique',     'Comprimé', '500mg',   'Vitamine'),
('Vitamin D3 1000IU',    'Cholécalciférol',      'Comprimé', '1000UI',  'Vitamine'),
('Calcium 500mg',        'Carbonate de calcium', 'Comprimé', '500mg',   'Minéral'),
('Ferrous Sulfate 200mg','Sulfate ferreux',       'Comprimé', '200mg',   'Supplément fer'),
('Folic Acid 5mg',       'Acide folique',        'Comprimé', '5mg',     'Vitamine B9'),
('Zinc 20mg',            'Sulfate de zinc',      'Comprimé', '20mg',    'Oligo-élément'),

-- Antihistaminiques / Asthme
('Cetirizine 10mg',      'Cétirizine',           'Comprimé', '10mg',    'Antihistaminique'),
('Salbutamol inhaler',   'Salbutamol',           'Inhalateur','100mcg/dose','Bronchodilatateur'),
('Prednisolone 5mg',     'Prednisolone',         'Comprimé', '5mg',     'Corticoïde'),
('Prednisolone 20mg',    'Prednisolone',         'Comprimé', '20mg',    'Corticoïde'),

-- Anticoagulants
('Warfarin 1mg',         'Warfarine',            'Comprimé', '1mg',     'Anticoagulant'),
('Warfarin 5mg',         'Warfarine',            'Comprimé', '5mg',     'Anticoagulant'),

-- Yeux
('Latanoprost 0.005%',   'Latanoprost',          'Collyre',  '0.005%',  'Antiglaucomateux'),
('Timolol 0.5%',         'Timolol',              'Collyre',  '0.5%',    'Bêtabloquant ophtalmique');
