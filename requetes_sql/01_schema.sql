-- ============================================================
--  St Hugh's Anglican Home — Rose Hill, Mauritius
--  Système de gestion médicale des résidents
--  Base de données: stHughAnglican_simpleCabinetMedical
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- TABLE: doctors (médecins traitants)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  titre           VARCHAR(20) DEFAULT 'Dr.',
  nom             VARCHAR(100) NOT NULL,
  prenom          VARCHAR(100) NOT NULL,
  specialite      VARCHAR(200) DEFAULT 'Médecine Générale',
  telephone       VARCHAR(30),
  telephone2      VARCHAR(30),
  email           VARCHAR(200),
  clinique        VARCHAR(300),
  adresse         TEXT,
  jours_consultation VARCHAR(200),
  notes           TEXT,
  actif           BOOLEAN     DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_nom ON doctors(nom, prenom);

-- ============================================================
-- TABLE: residents (les résidents de la maison)
-- ============================================================
CREATE TABLE IF NOT EXISTS residents (
  id                     UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_chambre         VARCHAR(10),
  nom                    VARCHAR(100) NOT NULL,
  prenom                 VARCHAR(100) NOT NULL,
  date_naissance         DATE,
  sexe                   VARCHAR(10)  CHECK (sexe IN ('Masculin','Féminin','Autre')),
  date_entree            DATE         DEFAULT CURRENT_DATE,
  medecin_id             UUID         REFERENCES doctors(id) ON DELETE SET NULL,
  groupe_sanguin         VARCHAR(5)   CHECK (groupe_sanguin IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies              TEXT,
  antecedents            TEXT,
  conditions_chroniques  TEXT,
  mobilite               VARCHAR(50)  CHECK (mobilite IN ('Autonome','Assistance partielle','Fauteuil roulant','Alitement')),
  niveau_priorite        SMALLINT     DEFAULT 3
                           CHECK (niveau_priorite IN (1,2,3)),
  -- 1=Urgent, 2=Élevé, 3=Normal
  contact_famille_nom    VARCHAR(200),
  contact_famille_tel    VARCHAR(30),
  contact_famille_relation VARCHAR(50),
  notes_medicales        TEXT,
  photo_url              TEXT,
  actif                  BOOLEAN      DEFAULT TRUE,
  created_at             TIMESTAMPTZ  DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_residents_nom        ON residents(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_residents_chambre    ON residents(numero_chambre);
CREATE INDEX IF NOT EXISTS idx_residents_medecin    ON residents(medecin_id);
CREATE INDEX IF NOT EXISTS idx_residents_priorite   ON residents(niveau_priorite);
CREATE INDEX IF NOT EXISTS idx_residents_actif      ON residents(actif);
CREATE INDEX IF NOT EXISTS idx_residents_fts ON residents
  USING gin(to_tsvector('french',
    COALESCE(nom,'') || ' ' || COALESCE(prenom,'') || ' ' || COALESCE(numero_chambre,'')
  ));

-- ============================================================
-- TABLE: medicaments (catalogue des médicaments)
-- ============================================================
CREATE TABLE IF NOT EXISTS medicaments (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_commercial   VARCHAR(200) NOT NULL,
  nom_generique    VARCHAR(200),
  forme            VARCHAR(100),
  dosage_standard  VARCHAR(100),
  classe           VARCHAR(200),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON medicaments(nom_commercial);
CREATE INDEX IF NOT EXISTS idx_medicaments_fts ON medicaments
  USING gin(to_tsvector('french',
    COALESCE(nom_commercial,'') || ' ' || COALESCE(nom_generique,'')
  ));

-- ============================================================
-- TABLE: traitements (médicaments en cours par résident)
-- Cœur du système de suivi
-- ============================================================
CREATE TABLE IF NOT EXISTS traitements (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id      UUID        NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  medicament_id    UUID        REFERENCES medicaments(id) ON DELETE SET NULL,
  nom_medicament   VARCHAR(200) NOT NULL,
  dosage           VARCHAR(100),
  posologie        TEXT         NOT NULL,
  date_debut       DATE         NOT NULL DEFAULT CURRENT_DATE,
  duree_jours      INTEGER,
  date_fin         DATE         GENERATED ALWAYS AS (
                     CASE WHEN duree_jours IS NOT NULL
                     THEN date_debut + duree_jours::INTEGER
                     ELSE NULL END
                   ) STORED,
  -- Renouvellement: quand alerter (24h avant fin)
  alerte_renouvellement BOOLEAN DEFAULT TRUE,
  traitement_chronique BOOLEAN DEFAULT FALSE,
  -- Traitement chronique = sans date de fin
  notes            TEXT,
  actif            BOOLEAN     DEFAULT TRUE,
  prescrit_par     UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  consultation_id  UUID,       -- FK ajoutée après la table consultations
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traitements_resident    ON traitements(resident_id);
CREATE INDEX IF NOT EXISTS idx_traitements_actif       ON traitements(actif);
CREATE INDEX IF NOT EXISTS idx_traitements_date_fin    ON traitements(date_fin);

-- ============================================================
-- TABLE: consultations (visites médicales)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id          UUID        NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  medecin_id           UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  date_consultation    TIMESTAMPTZ DEFAULT NOW(),
  motif                TEXT,
  tension_arterielle   VARCHAR(20),
  temperature          NUMERIC(4,1),
  pouls                INTEGER,
  poids                NUMERIC(5,2),
  taille               NUMERIC(5,2),
  saturation_o2        NUMERIC(5,2),
  imc                  NUMERIC(5,2) GENERATED ALWAYS AS (
                         CASE WHEN taille > 0 AND poids > 0
                         THEN ROUND((poids / POWER(taille/100.0,2))::NUMERIC,2)
                         ELSE NULL END
                       ) STORED,
  observations         TEXT,
  diagnostic           TEXT,
  traitement_note      TEXT,
  prochain_rdv         DATE,
  -- Ordonnance uploadée (Supabase Storage)
  ordonnance_url       TEXT,
  ordonnance_nom       VARCHAR(300),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_resident ON consultations(resident_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin  ON consultations(medecin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date     ON consultations(date_consultation DESC);

-- FK différée: traitements → consultations
ALTER TABLE traitements
  ADD CONSTRAINT fk_traitements_consultation
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: rendez_vous
-- ============================================================
CREATE TABLE IF NOT EXISTS rendez_vous (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id    UUID        NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  medecin_id     UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  date_rdv       TIMESTAMPTZ NOT NULL,
  duree_minutes  INTEGER     DEFAULT 30,
  motif          TEXT,
  statut         VARCHAR(20) DEFAULT 'planifie'
                   CHECK (statut IN ('planifie','confirme','effectue','annule','absent')),
  est_urgence    BOOLEAN     DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rdv_resident   ON rendez_vous(resident_id);
CREATE INDEX IF NOT EXISTS idx_rdv_medecin    ON rendez_vous(medecin_id);
CREATE INDEX IF NOT EXISTS idx_rdv_date       ON rendez_vous(date_rdv);
CREATE INDEX IF NOT EXISTS idx_rdv_statut     ON rendez_vous(statut);

-- ============================================================
-- TABLE: alertes (système de notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS alertes (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type         VARCHAR(50) NOT NULL
                 CHECK (type IN (
                   'medicament_24h','medicament_epuise','visite_requise',
                   'rdv_manque','pas_vu_30j','urgence','autre'
                 )),
  resident_id  UUID        REFERENCES residents(id) ON DELETE CASCADE,
  titre        VARCHAR(300) NOT NULL,
  message      TEXT,
  priorite     SMALLINT    DEFAULT 2 CHECK (priorite IN (1,2,3)),
  lue          BOOLEAN     DEFAULT FALSE,
  traitee      BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertes_resident  ON alertes(resident_id);
CREATE INDEX IF NOT EXISTS idx_alertes_lue       ON alertes(lue);
CREATE INDEX IF NOT EXISTS idx_alertes_type      ON alertes(type);
CREATE INDEX IF NOT EXISTS idx_alertes_created   ON alertes(created_at DESC);

-- ============================================================
-- TABLE: planning_visites (planification hebdomadaire)
-- Slots de visites médicales: 2 fois/semaine
-- ============================================================
CREATE TABLE IF NOT EXISTS planning_visites (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date_visite    DATE        NOT NULL,
  medecin_id     UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  heure_debut    TIME        DEFAULT '08:00',
  heure_fin      TIME        DEFAULT '12:00',
  nb_max         INTEGER     DEFAULT 12,
  notes          TEXT,
  statut         VARCHAR(20) DEFAULT 'planifie'
                   CHECK (statut IN ('planifie','en_cours','termine','annule')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_date    ON planning_visites(date_visite);
CREATE INDEX IF NOT EXISTS idx_planning_medecin ON planning_visites(medecin_id);

-- ============================================================
-- TABLE: planning_residents (qui passe sur quel slot)
-- ============================================================
CREATE TABLE IF NOT EXISTS planning_residents (
  id              UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  planning_id     UUID     NOT NULL REFERENCES planning_visites(id) ON DELETE CASCADE,
  resident_id     UUID     NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  ordre           INTEGER  DEFAULT 1,
  statut          VARCHAR(20) DEFAULT 'planifie'
                    CHECK (statut IN ('planifie','effectue','absent','reporte')),
  consultation_id UUID     REFERENCES consultations(id) ON DELETE SET NULL,
  UNIQUE(planning_id, resident_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_planning  ON planning_residents(planning_id);
CREATE INDEX IF NOT EXISTS idx_pr_resident  ON planning_residents(resident_id);

-- ============================================================
-- TABLE: cabinet (paramètres)
-- ============================================================
CREATE TABLE IF NOT EXISTS cabinet (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nom             VARCHAR(300) DEFAULT 'St Hugh''s Anglican Home',
  adresse         TEXT         DEFAULT 'Rose Hill, Mauritius',
  telephone       VARCHAR(30)  DEFAULT '4641124',
  email           VARCHAR(200),
  responsable_medical VARCHAR(200),
  jours_visites   VARCHAR(200) DEFAULT 'Mardi, Vendredi',
  entete_ordonnance TEXT,
  pied_ordonnance  TEXT,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);
