-- ============================================================
--  32_specialites_rdv_lieu.sql
--  St Hugh's Anglican Home - Lot F des MAJ du 19/07/2026
--  Point 6, partie hors module Hopitaux (le module viendra au
--  lot I et pourra remplacer l'etablissement libre par une
--  reference).
--
--  1. Specialites en liste fermee. Le champ etait un texte libre
--     avec « Medecine Generale » pour valeur par defaut : deux
--     saisies differentes de la meme specialite ne se
--     regroupaient pas. Contrainte CHECK, comme mobilite,
--     groupe_sanguin et sexe ailleurs dans le schema.
--     ATTENTION : ajouter une specialite demande une migration.
--     La valeur « Autre » evite de bloquer une saisie legitime.
--
--  2. Rendez-vous : un RDV vise un medecin OU un etablissement,
--     et porte dans les deux cas un lieu (foyer, cabinet,
--     hopital) qui dit si le resident doit etre transporte.
--
--  3. Correction du secteur de deux medecins. Le backfill du
--     SQL 31 avait tout passe en prive ; Hopital Victoria et
--     Hopital SSRN sont publics. Correction demandee par
--     l'utilisateur.
-- ============================================================

begin;

-- ── 1. Specialites normalisees ──────────────────────────────

-- Les cinq valeurs deja en base font partie de la liste : aucune
-- reprise de donnees n'est necessaire, mais on normalise les
-- espaces au cas ou.
update public.doctors set specialite = trim(specialite) where specialite is not null;

alter table public.doctors drop constraint if exists doctors_specialite_check;

alter table public.doctors
  add constraint doctors_specialite_check
  check (specialite is null or specialite in (
    'Médecine Générale', 'Gériatrie', 'Médecine Interne',
    'Cardiologie', 'Neurologie', 'Pneumologie', 'Gastro-entérologie',
    'Endocrinologie', 'Néphrologie', 'Rhumatologie', 'Urologie',
    'Dermatologie', 'Ophtalmologie', 'ORL', 'Orthopédie',
    'Psychiatrie', 'Dentiste', 'Kinésithérapie', 'Podologie',
    'Autre'
  ));

comment on column public.doctors.specialite is
  'Liste fermee (contrainte doctors_specialite_check). Ajouter une valeur demande une migration.';

-- ── 2. Secteur : correction des deux hopitaux publics ───────

update public.doctors
   set secteur = 'public'
 where clinique ilike '%hôpital%' or clinique ilike '%hopital%';

-- ── 3. Rendez-vous : etablissement et lieu ──────────────────

alter table public.rendez_vous
  add column if not exists etablissement varchar(150),
  add column if not exists lieu          varchar(20);

comment on column public.rendez_vous.etablissement is
  'Etablissement vise quand le RDV ne pointe pas un medecin de la liste. Le module Hopitaux du lot I pourra le remplacer par une reference.';
comment on column public.rendez_vous.lieu is
  'Ou se tient le RDV : foyer, cabinet ou hopital. Dit si le resident doit etre transporte.';

alter table public.rendez_vous drop constraint if exists rendez_vous_lieu_check;
alter table public.rendez_vous
  add constraint rendez_vous_lieu_check
  check (lieu is null or lieu in ('foyer', 'cabinet', 'hopital'));

-- Un RDV doit viser quelqu'un ou quelque part. Les 5 RDV
-- existants ont tous un medecin, la contrainte passe sans reprise.
alter table public.rendez_vous drop constraint if exists rendez_vous_cible_check;
alter table public.rendez_vous
  add constraint rendez_vous_cible_check
  check (medecin_id is not null or etablissement is not null);

-- ── 4. Vue de detail a jour ─────────────────────────────────
--  Ajout en FIN de liste : `create or replace view` ne tolere pas
--  l'insertion d'une colonne au milieu (42P16).

create or replace view public.v_rdv_detail
with (security_invoker = on) as
select rv.id,
       rv.resident_id,
       rv.medecin_id,
       rv.date_rdv,
       rv.duree_minutes,
       rv.motif,
       rv.statut,
       rv.est_urgence,
       rv.notes,
       rv.created_at,
       rv.updated_at,
       r.nom          as resident_nom,
       r.prenom       as resident_prenom,
       r.numero_chambre,
       r.niveau_priorite,
       d.titre        as medecin_titre,
       d.nom          as medecin_nom,
       d.prenom       as medecin_prenom,
       rv.consultation_id,
       -- Ajouts du lot F
       rv.etablissement,
       rv.lieu,
       d.specialite   as medecin_specialite,
       d.secteur      as medecin_secteur
  from public.rendez_vous rv
  join public.residents r on rv.resident_id = r.id
  left join public.doctors d on rv.medecin_id = d.id
 order by rv.date_rdv;

commit;

-- ── Verification ────────────────────────────────────────────

select 'specialites hors liste' as controle, count(*)::text as valeur
  from doctors where specialite is not null and specialite not in (
    'Médecine Générale','Gériatrie','Médecine Interne','Cardiologie','Neurologie',
    'Pneumologie','Gastro-entérologie','Endocrinologie','Néphrologie','Rhumatologie',
    'Urologie','Dermatologie','Ophtalmologie','ORL','Orthopédie','Psychiatrie',
    'Dentiste','Kinésithérapie','Podologie','Autre')
union all
select 'medecins en secteur public', (select count(*)::text from doctors where secteur='public')
union all
select 'medecins en secteur prive',  (select count(*)::text from doctors where secteur='prive')
union all
select 'colonnes lot F dans v_rdv_detail',
       (select count(*)::text from information_schema.columns
         where table_schema='public' and table_name='v_rdv_detail'
           and column_name in ('etablissement','lieu','medecin_specialite','medecin_secteur'))
union all
select 'rdv toujours lisibles', (select count(*)::text from v_rdv_detail);
