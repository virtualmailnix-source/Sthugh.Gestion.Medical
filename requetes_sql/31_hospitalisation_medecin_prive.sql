-- ============================================================
--  31_hospitalisation_medecin_prive.sql
--  St Hugh's Anglican Home - Lot E des MAJ du 19/07/2026
--
--  Point 5  : medecin prive. Deux besoins distincts, retenus tous
--             les deux par l'utilisateur.
--             a) doctors.secteur : le medecin exerce en cabinet
--                prive ou depend du public (hopital). Le lot F
--                ajoutera des categories plus fines ; ce champ
--                reste la distinction structurante a Maurice.
--             b) residents.medecin_prive_* : le medecin personnel
--                du resident, EN PLUS du medecin traitant de la
--                maison (residents.medecin_id). Texte libre et non
--                cle etrangere : ces praticiens exterieurs ne sont
--                pas geres dans l'application.
--
--  Point 11 : hospitaliser. Quatrieme statut de sortie, calque sur
--             « vacances » : absence TEMPORAIRE, dossier actif et
--             modifiable, resident toujours compte dans l'effectif,
--             retour au foyer par le meme bouton.
--
--  Le point 4 (filtres age et sexe) ne demande aucune migration :
--  residents.sexe et residents.date_naissance existent deja.
--
--  NOTE sur les vues : leurs colonnes sont explicites et
--  `create or replace view` n'autorise l'ajout QU'EN FIN de liste
--  (erreur 42P16 sinon, rencontree sur le SQL 29). Les nouvelles
--  colonnes sont donc ajoutees a la fin, meme si l'ordre logique
--  voudrait les voir ailleurs.
-- ============================================================

begin;

-- ── 1. Quatrieme statut de sortie ───────────────────────────

alter table public.residents
  drop constraint if exists residents_statut_depart_check;

alter table public.residents
  add constraint residents_statut_depart_check
  check (statut_depart is null or statut_depart in
         ('vacances', 'hospitalisation', 'depart', 'deces'));

-- Etablissement ou le resident est hospitalise. Texte libre : le
-- module Hopitaux du lot I pourra le remplacer par une reference.
alter table public.residents
  add column if not exists etablissement_sante varchar(150);

comment on column public.residents.etablissement_sante is
  'Etablissement d''hospitalisation, renseigne tant que statut_depart = hospitalisation';

-- ── 2. Medecin prive personnel du resident ──────────────────

alter table public.residents
  add column if not exists medecin_prive_nom       varchar(120),
  add column if not exists medecin_prive_telephone varchar(40);

comment on column public.residents.medecin_prive_nom is
  'Medecin personnel du resident, exterieur a la maison. Distinct de medecin_id (medecin traitant).';

-- ── 3. Secteur d''exercice du medecin ───────────────────────

alter table public.doctors
  add column if not exists secteur varchar(10);

-- Les medecins deja saisis sont ceux de la maison : prive par
-- defaut, l'utilisateur corrigera au cas par cas.
update public.doctors set secteur = 'prive' where secteur is null;

alter table public.doctors
  drop constraint if exists doctors_secteur_check;

alter table public.doctors
  add constraint doctors_secteur_check
  check (secteur is null or secteur in ('prive', 'public'));

comment on column public.doctors.secteur is
  'prive = cabinet, public = hopital. Categories plus fines a venir au lot F.';

-- ── 4. Historique des absences ──────────────────────────────
--  L'historique ne disait pas de quel type d''absence il s''agissait.
--  Toutes les lignes existantes sont des vacances : c''etait le seul
--  statut temporaire avant aujourd''hui.

alter table public.historique_sorties
  add column if not exists type_sortie         varchar(20),
  add column if not exists etablissement_sante varchar(150);

update public.historique_sorties set type_sortie = 'vacances' where type_sortie is null;

alter table public.historique_sorties
  drop constraint if exists historique_sorties_type_check;

alter table public.historique_sorties
  add constraint historique_sorties_type_check
  check (type_sortie is null or type_sortie in ('vacances', 'hospitalisation'));

-- ── 5. Vues a jour ──────────────────────────────────────────
--  Ajout en FIN de liste, voir la note en tete de fichier.

create or replace view public.v_residents_public
with (security_invoker = on) as
select id,
       numero_chambre,
       nom,
       prenom,
       cin,
       date_naissance,
       sexe,
       date_entree,
       photo_url,
       actif,
       statut_depart,
       date_sortie,
       date_retour_prevue,
       motif_sortie,
       created_at,
       -- L'accueil doit pouvoir dire ou joindre un resident absent.
       -- Le medecin prive n'y figure PAS : information medicale.
       etablissement_sante
  from public.residents
 where fn_is_app_user();

create or replace view public.v_residents_priorite
with (security_invoker = on) as
select r.id,
       r.numero_chambre,
       r.nom,
       r.prenom,
       r.date_naissance,
       r.sexe,
       r.date_entree,
       r.medecin_id,
       r.groupe_sanguin,
       r.allergies,
       r.antecedents,
       r.conditions_chroniques,
       r.mobilite,
       r.niveau_priorite,
       r.notes_medicales,
       r.photo_url,
       r.actif,
       r.created_at,
       r.updated_at,
       r.taille,
       r.statut_depart,
       r.date_sortie,
       r.date_retour_prevue,
       r.motif_sortie,
       r.motif_deces,
       r.cin,
       d.nom       as medecin_nom,
       d.prenom    as medecin_prenom,
       d.titre     as medecin_titre,
       d.telephone as medecin_telephone,
       c.date_consultation as derniere_consultation,
       case when c.date_consultation is null then null::integer
            else current_date - c.date_consultation::date
       end as jours_sans_consultation,
       coalesce((select count(*) from traitements t
                  where t.resident_id = r.id and t.actif = true
                    and t.traitement_chronique = false
                    and t.date_fin is not null
                    and t.date_fin <= (current_date + '1 day'::interval)), 0::bigint) as traitements_urgents,
       coalesce((select count(*) from traitements t
                  where t.resident_id = r.id and t.actif = true
                    and t.traitement_chronique = false
                    and t.date_fin is not null
                    and t.date_fin <= (current_date + '3 days'::interval)
                    and t.date_fin >  (current_date + '1 day'::interval)), 0::bigint) as traitements_bientot,
       coalesce(case when c.date_consultation is null then 80
                     when (current_date - c.date_consultation::date) > 30 then 60
                     when (current_date - c.date_consultation::date) > 21 then 35
                     when (current_date - c.date_consultation::date) > 14 then 15
                     else 0 end, 80)
     + coalesce(case when exists (select 1 from traitements t
                                   where t.resident_id = r.id and t.actif = true
                                     and t.traitement_chronique = false
                                     and t.date_fin is not null
                                     and t.date_fin <= (current_date + '1 day'::interval)) then 50
                     when exists (select 1 from traitements t
                                   where t.resident_id = r.id and t.actif = true
                                     and t.traitement_chronique = false
                                     and t.date_fin is not null
                                     and t.date_fin <= (current_date + '3 days'::interval)) then 25
                     else 0 end, 0)
     + case r.niveau_priorite when 1 then 40 when 2 then 20 else 0 end as score_priorite,
       -- Ajouts du lot E, en fin de liste (contrainte 42P16)
       r.etablissement_sante,
       r.medecin_prive_nom,
       r.medecin_prive_telephone,
       d.secteur as medecin_secteur
  from public.residents r
  left join public.doctors d on d.id = r.medecin_id
  left join lateral (
        select max(x.dt) as date_consultation
          from (select consultations.date_consultation as dt
                  from consultations
                 where consultations.resident_id = r.id
                union all
                select rendez_vous.date_rdv
                  from rendez_vous
                 where rendez_vous.resident_id = r.id
                   and (rendez_vous.statut::text <> all (array['annule','absent']::text[]))
                   and (rendez_vous.date_rdv <= now() or rendez_vous.statut::text = 'effectue')) x
  ) c on true;

-- ── 6. Retour au foyer cote accueil ─────────────────────────
--  La RPC utilisee par la receptionniste ne connaissait que les
--  vacances : le bouton de retour aurait echoue sur une
--  hospitalisation. Elle archive aussi le type et l'etablissement.

create or replace function public.fn_accueil_retour(p_resident_id uuid)
returns boolean
language plpgsql
security definer
as $function$
declare
  r record;
begin
  if not fn_is_app_user() then
    raise exception 'Accès refusé';
  end if;

  select statut_depart, date_sortie, date_retour_prevue, motif_sortie, etablissement_sante
    into r
    from residents
   where id = p_resident_id
     and statut_depart in ('vacances', 'hospitalisation');
  if not found then return false; end if;

  if r.date_sortie is not null then
    insert into historique_sorties
      (resident_id, date_sortie, date_retour, date_retour_prevue, motif_sortie,
       type_sortie, etablissement_sante)
    values
      (p_resident_id, r.date_sortie, now(), r.date_retour_prevue, r.motif_sortie,
       coalesce(r.statut_depart, 'vacances'), r.etablissement_sante);
  end if;

  update residents
     set statut_depart = null, date_sortie = null,
         date_retour_prevue = null, motif_sortie = null,
         etablissement_sante = null, actif = true
   where id = p_resident_id;
  return true;
end;
$function$;

commit;

-- ── Verification ────────────────────────────────────────────

select 'statut hospitalisation accepte' as controle,
       case when pg_get_constraintdef(oid) ilike '%hospitalisation%' then 'OUI' else 'NON' end as valeur
  from pg_constraint where conname = 'residents_statut_depart_check'
union all
select 'residents.etablissement_sante',
       coalesce((select 'AJOUTEE' from information_schema.columns
                  where table_schema='public' and table_name='residents' and column_name='etablissement_sante'), 'ABSENTE')
union all
select 'residents.medecin_prive_nom',
       coalesce((select 'AJOUTEE' from information_schema.columns
                  where table_schema='public' and table_name='residents' and column_name='medecin_prive_nom'), 'ABSENTE')
union all
select 'doctors.secteur renseigne',
       (select count(*)::text from doctors where secteur is not null)
union all
select 'historique_sorties.type_sortie renseigne',
       (select count(*)::text from historique_sorties where type_sortie is not null)
union all
select 'v_residents_priorite : colonnes lot E',
       (select count(*)::text from information_schema.columns
         where table_schema='public' and table_name='v_residents_priorite'
           and column_name in ('etablissement_sante','medecin_prive_nom','medecin_prive_telephone','medecin_secteur'))
union all
select 'v_residents_public : etablissement_sante',
       coalesce((select 'PRESENTE' from information_schema.columns
                  where table_schema='public' and table_name='v_residents_public' and column_name='etablissement_sante'), 'ABSENTE')
union all
select 'residents lisibles apres recreation des vues',
       (select count(*)::text from v_residents_priorite);
