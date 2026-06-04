-- ============================================================
--  09_seed_400_residents.sql
--  Données de test — 400 résidents fictifs avec médecins,
--  traitements, consultations et rendez-vous
--  Contexte : Rose Hill, Mauritius
--  À exécuter APRÈS les fichiers 01 à 08
-- ============================================================

-- ── 1. Ajouter 5 médecins supplémentaires ───────────────────
INSERT INTO doctors (titre, nom, prenom, specialite, telephone, clinique, jours_consultation, actif)
VALUES
  ('Dr.', 'PERMALLOO',  'Sunita',  'Gériatrie',             '4675678', 'Clinique Darné',       'Lundi, Mercredi, Vendredi', TRUE),
  ('Dr.', 'BAPPOO',     'Raj',     'Médecine Interne',      '4686789', 'Hôpital SSRN',         'Mardi, Jeudi', TRUE),
  ('Dr.', 'OOZEER',     'Yusuf',   'Cardiologie',           '4697890', 'Clinique Ferrière',    'Mercredi, Samedi', TRUE),
  ('Dr.', 'LABONNE',    'Claire',  'Médecine Générale',     '4608901', 'Cabinet Rose Hill',    'Lundi, Mardi, Jeudi', TRUE),
  ('Dr.', 'RAMSAMY',    'Vikash',  'Neurologie',            '4619012', 'Hôpital Victoria',    'Vendredi', TRUE)
ON CONFLICT DO NOTHING;

-- ── 2. Génération des 400 résidents (bloc PL/pgSQL) ─────────
DO $$
DECLARE
  /* ── Noms de famille mauriciens (hindous, musulmans, créoles, chinois) */
  noms_h TEXT[] := ARRAY[
    'RAMPHUL','LUTCHMEE','DABY','BOODHUN','RAMSAMY','BISSOONAUTH',
    'SEENAUTH','HANSNAH','NUNDLOLL','MOONESAMY','GOOMANY','RAMJEE',
    'VEERAPEN','LUTCHMEEPARSAD','SEEBURN','SEETARAM','GUJADHUR',
    'DABEESING','BHONDOO','RAMLOGUN','PURSUN','RAMKHELAWON',
    'CALLYCHURN','SEEGOOLAM','NAIDOO','PILLAY','MANRAKHAN',
    'PUNCHOO','RAMDEHAL','BEEHARRY','GOKHOOL','RAMPERSAD',
    'DOMUN','DOOKUN','BABOOLALL','HURBUNGS','RAMNARAIN',
    'JHURRY','BHOLAH','GOBIN','OODITH','RAMBURN'
  ];
  noms_m TEXT[] := ARRAY[
    'JOOMUN','BUNDHOO','OOZEER','KHODABACCUS','MOOLLAN','SAIB',
    'KORIMBOCUS','CADERSA','BHOYROO','RAMTOOLA','ELAHEE','PEERUN',
    'GOOLAMAULLY','SOOGUN','HOSANY','KAULIL','EMRITH','BEEJAN',
    'BHUGON','SULLIMAN','RAMJATTUN','CHOOMKA'
  ];
  noms_c TEXT[] := ARRAY[
    'LABONNE','FONTAINE','RAULT','RIVIERE','BONHOMME','VALAYDEN',
    'PAPILLON','NARCISSE','CELESTINE','HERMITTE','LARUE','LOUIS',
    'ABEL','CONSTANCE','EDOUARD','FELIX','GABRIEL','ISAAC',
    'JOACHIM','KLIMOS','LEBON','MARIE','NAROD','ODETTE'
  ];
  noms_cn TEXT[] := ARRAY[
    'AH KOON','LAM SOON','WAN SING','CHAN','LI','WONG','NG','CHONG',
    'TAN','YEW','SIM','LIANG'
  ];
  tous_noms TEXT[];

  /* ── Prénoms */
  pren_m TEXT[] := ARRAY[
    'Jean','Pierre','Marc','Louis','Henri','Robert','Albert','Georges',
    'Raymond','Maurice','Paul','Anand','Raj','Vishnu','Anil','Sunil',
    'Dinesh','Ramesh','Sanjay','Ashvin','Mohamed','Ismail','Hassan',
    'Ahmed','Youssef','Ranjit','Kumar','Pradeep','Ravi','Narayan',
    'Joseph','Patrick','Michel','André','Bernard','Gérard','René',
    'Francis','Serge','Edmond','Gaston','Fernand','Lucien','Edouard',
    'Emile','Clément','Antoine','Daniel','Roger','Victor','Charles'
  ];
  pren_f TEXT[] := ARRAY[
    'Marie','Rose','Sylvie','Christiane','Monique','Andrée','Suzanne',
    'Thérèse','Jacqueline','Colette','Hélène','Marguerite','Lucie',
    'Solange','Yvonne','Pauline','Bernadette','Anne','Claire','Nicole',
    'Radha','Geeta','Anita','Sunita','Priya','Kavitha','Meena',
    'Indira','Shanti','Kamini','Aysha','Fatima','Mariam','Zarina',
    'Halima','Rohini','Pushpa','Ambika','Savitri','Devi',
    'Micheline','Josette','Liliane','Pierrette','Madeleine','Françoise',
    'Simone','Denise','Evelyne','Renée','Gisèle','Odette','Laure'
  ];

  /* ── Conditions chroniques */
  conditions TEXT[] := ARRAY[
    'Hypertension artérielle','Diabète type 2','Arthrose des genoux',
    'Insuffisance cardiaque légère','BPCO','Hypothyroïdie',
    'Ostéoporose','Démence légère à modérée','Hypercholestérolémie',
    'Insuffisance veineuse chronique','Glaucome','Parkinson stade I',
    'Dépression','Anémie chronique','Insuffisance rénale chronique légère',
    'Fibrillation auriculaire','AVC séquellaire','Dysphagie'
  ];

  /* ── Mobilités (pondérées vers autonome) */
  mobilites TEXT[] := ARRAY[
    'Autonome','Autonome','Autonome','Autonome',
    'Assistance partielle','Assistance partielle',
    'Fauteuil roulant','Alitement'
  ];

  /* ── Groupes sanguins */
  groupes TEXT[] := ARRAY['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  poids_groupes FLOAT[] := ARRAY[0.34,0.06,0.09,0.02,0.04,0.01,0.38,0.06];

  /* ── Médicaments courants (Maurice) */
  med_noms TEXT[] := ARRAY[
    'Amlodipine 5mg','Amlodipine 10mg','Enalapril 10mg','Enalapril 20mg',
    'Metformine 500mg','Metformine 850mg','Atorvastatine 20mg','Atorvastatine 40mg',
    'Furosémide 40mg','Aspirine 100mg','Oméprazole 20mg','Metoprolol 50mg',
    'Glibenclamide 5mg','Lisinopril 10mg','Warfarine 5mg','Lévothyroxine 50mcg',
    'Calcium + Vit D3','Paracétamol 500mg','Ibuprofène 400mg','Clopidogrel 75mg',
    'Hydrochlorothiazide 25mg','Prednisone 5mg','Allopurinol 100mg',
    'Spironolactone 25mg','Bisoprolol 5mg','Ramipril 5mg','Valsartan 80mg',
    'Sitagliptine 100mg','Glicazide 80mg','Lorazépam 1mg'
  ];
  posologies TEXT[] := ARRAY[
    '1 cp le matin','1 cp le soir','1 cp matin et soir',
    '2 cp le matin','1 cp 2 fois/jour','1 cp avec repas du soir',
    '1 cp 3 fois/jour','½ cp le matin','1 cp à jeun',
    '1 cp avant coucher'
  ];

  /* ── Motifs consultation */
  motifs TEXT[] := ARRAY[
    'Consultation de routine','Suivi hypertension','Suivi diabète',
    'Contrôle traitement','Douleurs articulaires','Essoufflement',
    'Contrôle tension','Renouvellement ordonnance','Toux persistante',
    'Vertiges','Fatigue chronique','Contrôle glycémie',
    'Suivi cardiaque','Bilan sanguin de contrôle','Chute récente',
    'Douleurs thoraciques légères','Troubles du sommeil','Œdème membres inférieurs'
  ];
  diagnostics TEXT[] := ARRAY[
    'HTA bien contrôlée','Diabète équilibré sous traitement',
    'Arthrose stable — kinésithérapie recommandée',
    'Insuffisance cardiaque compensée','BPCO stable — poursuite traitement',
    'Traitement adapté — contrôle à 3 mois','Glycémie à surveiller',
    'TA légèrement élevée — ajuster traitement','Bon état général',
    'Infection respiratoire légère — antibiotique 5j','Anémie légère',
    'Équilibre perturbé — bilan chute','État stationnaire',
    'Amélioration nette','Pas de changement notable'
  ];

  /* ── Relations famille */
  relations TEXT[] := ARRAY[
    'Fils','Fille','Neveu','Nièce','Petit-fils','Petite-fille',
    'Frère','Sœur','Cousin','Cousine','Époux','Épouse'
  ];

  /* ── Variables de travail */
  i          INTEGER;
  j          INTEGER;
  sexe       TEXT;
  prenom     TEXT;
  nom        TEXT;
  dob        DATE;
  chambre    TEXT;
  doc_id     UUID;
  r_id       UUID;
  nb_meds    INTEGER;
  nb_cons    INTEGER;
  nb_rdv     INTEGER;
  s_date     DATE;
  duree      INTEGER;
  is_chron   BOOLEAN;
  cons_date  TIMESTAMPTZ;
  rdv_date   TIMESTAMPTZ;
  tel        TEXT;
  niv_prio   SMALLINT;
  cond_txt   TEXT;
  doc_ids    UUID[];
  nm_idx     INTEGER;

BEGIN
  /* Combiner tous les noms */
  tous_noms := noms_h || noms_m || noms_c || noms_cn;

  /* Récupérer tous les IDs médecins actifs */
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO doc_ids
  FROM doctors WHERE actif = TRUE;

  IF doc_ids IS NULL OR array_length(doc_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Aucun médecin trouvé — exécutez d''abord 04_seed_data.sql';
  END IF;

  FOR i IN 1..400 LOOP

    /* ── Sexe */
    sexe := CASE WHEN random() < 0.48 THEN 'Masculin' ELSE 'Féminin' END;

    /* ── Nom aléatoire */
    nm_idx := 1 + (floor(random() * array_length(tous_noms, 1)))::int;
    IF nm_idx > array_length(tous_noms, 1) THEN nm_idx := array_length(tous_noms, 1); END IF;
    nom := tous_noms[nm_idx];

    /* ── Prénom selon sexe */
    IF sexe = 'Masculin' THEN
      nm_idx := 1 + (floor(random() * array_length(pren_m, 1)))::int;
      IF nm_idx > array_length(pren_m, 1) THEN nm_idx := array_length(pren_m, 1); END IF;
      prenom := pren_m[nm_idx];
    ELSE
      nm_idx := 1 + (floor(random() * array_length(pren_f, 1)))::int;
      IF nm_idx > array_length(pren_f, 1) THEN nm_idx := array_length(pren_f, 1); END IF;
      prenom := pren_f[nm_idx];
    END IF;

    /* ── Date de naissance (60 à 97 ans) */
    dob := CURRENT_DATE - (INTERVAL '1 day' * (floor(365.25 * 60 + random() * 365.25 * 37))::int);

    /* ── N° chambre */
    chambre := LPAD(i::TEXT, 3, '0');

    /* ── Médecin traitant aléatoire */
    nm_idx := 1 + (floor(random() * array_length(doc_ids, 1)))::int;
    IF nm_idx > array_length(doc_ids, 1) THEN nm_idx := array_length(doc_ids, 1); END IF;
    doc_id := doc_ids[nm_idx];

    /* ── Niveau de priorité (10% P1, 20% P2, 70% P3) */
    niv_prio := CASE
      WHEN random() < 0.10 THEN 1
      WHEN random() < 0.35 THEN 2
      ELSE 3
    END;

    /* ── Conditions chroniques (1 ou 2) */
    nm_idx := 1 + (floor(random() * array_length(conditions, 1)))::int;
    IF nm_idx > array_length(conditions, 1) THEN nm_idx := array_length(conditions, 1); END IF;
    cond_txt := conditions[nm_idx];
    IF random() < 0.65 THEN
      nm_idx := 1 + (floor(random() * array_length(conditions, 1)))::int;
      IF nm_idx > array_length(conditions, 1) THEN nm_idx := array_length(conditions, 1); END IF;
      cond_txt := cond_txt || E'\n' || conditions[nm_idx];
    END IF;

    /* ── Téléphone famille (format mauricien) */
    tel := '+230 5' || LPAD((floor(random() * 8999999 + 1000000))::int::TEXT, 7, '0');

    /* ── Insérer le résident ─────────────────────── */
    INSERT INTO residents (
      numero_chambre, nom, prenom, date_naissance, sexe,
      date_entree, medecin_id, groupe_sanguin,
      conditions_chroniques, mobilite, niveau_priorite,
      taille, actif
    ) VALUES (
      chambre,
      nom,
      prenom,
      dob,
      sexe,
      CURRENT_DATE - (INTERVAL '1 day' * (floor(random() * 365 * 5))::int),
      doc_id,
      groupes[1 + (floor(random() * 8))::int],
      cond_txt,
      mobilites[1 + (floor(random() * array_length(mobilites, 1)))::int],
      niv_prio,
      150 + floor(random() * 32)::int,
      TRUE
    ) RETURNING id INTO r_id;

    /* ── Contact famille ─────────────────────────── */
    nm_idx := 1 + (floor(random() * array_length(relations, 1)))::int;
    IF nm_idx > array_length(relations, 1) THEN nm_idx := array_length(relations, 1); END IF;
    INSERT INTO contacts_famille (resident_id, nom, telephone, relation, est_principal)
    VALUES (
      r_id,
      CASE WHEN random() < 0.5
        THEN pren_m[1 + (floor(random() * array_length(pren_m, 1)))::int] || ' ' || nom
        ELSE pren_f[1 + (floor(random() * array_length(pren_f, 1)))::int] || ' ' || nom
      END,
      tel,
      relations[nm_idx],
      TRUE
    );

    /* ── Traitements (1 à 3) ─────────────────────── */
    nb_meds := 1 + floor(random() * 2.4)::int;
    FOR j IN 1..nb_meds LOOP
      s_date   := CURRENT_DATE - (INTERVAL '1 day' * floor(random() * 200)::int);
      is_chron := random() < 0.40;
      duree    := CASE WHEN is_chron THEN NULL ELSE (30 + floor(random() * 90))::int END;
      nm_idx   := 1 + (floor(random() * array_length(med_noms, 1)))::int;
      IF nm_idx > array_length(med_noms, 1) THEN nm_idx := array_length(med_noms, 1); END IF;

      INSERT INTO traitements (
        resident_id, nom_medicament, dosage, posologie,
        date_debut, duree_jours, traitement_chronique,
        alerte_renouvellement, actif
      ) VALUES (
        r_id,
        med_noms[nm_idx],
        split_part(med_noms[nm_idx], ' ', 2),   -- dosage tiré du nom (ex: "5mg")
        posologies[1 + (floor(random() * array_length(posologies, 1)))::int],
        s_date,
        duree,
        is_chron,
        TRUE,
        TRUE
      );
    END LOOP;

    /* ── Consultations (1 à 4) ───────────────────── */
    nb_cons := 1 + floor(random() * 3.2)::int;
    FOR j IN 1..nb_cons LOOP
      cons_date := (CURRENT_DATE - (INTERVAL '1 day' * floor(random() * 400)::int))
                   + (INTERVAL '1 hour' * (8 + floor(random() * 8))::int);
      nm_idx := 1 + (floor(random() * array_length(motifs, 1)))::int;
      IF nm_idx > array_length(motifs, 1) THEN nm_idx := array_length(motifs, 1); END IF;
      INSERT INTO consultations (
        resident_id, medecin_id, date_consultation,
        motif, tension_arterielle, temperature, pouls, poids, taille,
        diagnostic
      ) VALUES (
        r_id, doc_id,
        cons_date,
        motifs[nm_idx],
        (110 + floor(random() * 55))::int::TEXT || '/' || (65 + floor(random() * 30))::int::TEXT,
        (36.0 + round((random() * 1.8)::numeric, 1))::numeric,
        60 + floor(random() * 42)::int,
        48 + floor(random() * 38)::int,
        150 + floor(random() * 32)::int,
        diagnostics[1 + (floor(random() * array_length(diagnostics, 1)))::int]
      );
    END LOOP;

    /* ── Rendez-vous futurs (0 à 2) ─────────────── */
    nb_rdv := CASE
      WHEN random() < 0.30 THEN 0
      WHEN random() < 0.70 THEN 1
      ELSE 2
    END;
    FOR j IN 1..nb_rdv LOOP
      rdv_date := (CURRENT_DATE + (INTERVAL '1 day' * (1 + floor(random() * 60))::int))
                  + (INTERVAL '1 hour' * (8 + floor(random() * 8))::int);
      nm_idx := 1 + (floor(random() * array_length(motifs, 1)))::int;
      IF nm_idx > array_length(motifs, 1) THEN nm_idx := array_length(motifs, 1); END IF;
      INSERT INTO rendez_vous (
        resident_id, medecin_id, date_rdv,
        duree_minutes, motif, statut, est_urgence
      ) VALUES (
        r_id, doc_id,
        rdv_date,
        30,
        motifs[nm_idx],
        CASE WHEN random() < 0.65 THEN 'planifie' ELSE 'confirme' END,
        random() < 0.05
      );
    END LOOP;

  END LOOP; -- fin boucle 400 résidents

  RAISE NOTICE '✓ 400 résidents fictifs créés avec contacts, traitements, consultations et rendez-vous.';
END $$;

-- ── Vérification rapide ─────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM residents) AS total_residents,
  (SELECT COUNT(*) FROM doctors)   AS total_doctors,
  (SELECT COUNT(*) FROM traitements) AS total_traitements,
  (SELECT COUNT(*) FROM consultations) AS total_consultations,
  (SELECT COUNT(*) FROM rendez_vous)   AS total_rdv,
  (SELECT COUNT(*) FROM contacts_famille) AS total_contacts;
