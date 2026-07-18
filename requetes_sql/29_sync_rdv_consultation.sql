-- ============================================================
--  29_sync_rdv_consultation.sql
--  St Hugh's Anglican Home - Le prochain rendez-vous demandé en
--  fin de consultation devient un vrai rendez-vous
--
--  BUG CORRIGÉ (lot A, point 7.1) : consultations.prochain_rdv
--  était enregistré mais aucun trigger ne créait la ligne dans
--  rendez_vous. La date restait donc invisible du calendrier et
--  de la liste. Constat au 19/07/2026 : 2 consultations sur 2
--  avaient un prochain_rdv, pour 0 rendez-vous correspondant.
--  C'est aussi la cause du point 7.3 (« Prochains rendez-vous »
--  vide) : la requête du front était correcte, il n'y avait
--  simplement aucun RDV futur en base.
--
--  1. rendez_vous.consultation_id : lien de traçabilité, sert
--     aussi de garde-fou anti-doublon (index unique partiel).
--  2. fn_sync_rdv_consultation() : crée le RDV, le suit si la
--     consultation est modifiée, le retire si la demande est
--     annulée. Ne touche JAMAIS un RDV déjà confirmé, effectué,
--     annulé ou marqué absent : à partir de là c'est le
--     personnel qui décide, pas la consultation d'origine.
--  3. v_rdv_detail recréée pour exposer la nouvelle colonne
--     (une vue fige la liste de ses colonnes à sa création).
--     ATTENTION : create or replace view n'autorise QUE l'ajout
--     de colonnes en fin de liste. Insérer consultation_id au
--     milieu échoue avec 42P16 « cannot change name of view
--     column ». D'où sa position en dernier ci-dessous.
--  4. Rattrapage des consultations déjà saisies.
--
--  Heure retenue : 09:00 à Maurice. prochain_rdv est une date
--  sans heure ; le personnel ajuste ensuite si besoin.
-- ============================================================

begin;

-- ── 1. Lien consultation -> rendez-vous ─────────────────────

alter table public.rendez_vous
  add column if not exists consultation_id uuid
  references public.consultations(id) on delete set null;

comment on column public.rendez_vous.consultation_id is
  'Consultation ayant demandé ce RDV via prochain_rdv. NULL si le RDV a été saisi directement.';

-- Un seul rendez-vous automatique par consultation
create unique index if not exists idx_rdv_consultation_unique
  on public.rendez_vous(consultation_id)
  where consultation_id is not null;

-- ── 2. Synchronisation ──────────────────────────────────────

create or replace function public.fn_sync_rdv_consultation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rdv_id  uuid;
  v_statut  varchar;
  v_date    timestamptz;
begin
  select id, statut into v_rdv_id, v_statut
    from rendez_vous
   where consultation_id = NEW.id;

  -- Demande retirée : on supprime le RDV s'il n'a pas encore été traité
  if NEW.prochain_rdv is null then
    if v_rdv_id is not null and v_statut = 'planifie' then
      delete from rendez_vous where id = v_rdv_id;
    end if;
    return NEW;
  end if;

  -- 09:00 heure de Maurice le jour demandé
  v_date := (NEW.prochain_rdv + time '09:00') at time zone 'Indian/Mauritius';

  if v_rdv_id is null then
    insert into rendez_vous
      (resident_id, medecin_id, date_rdv, duree_minutes, statut, consultation_id)
    values
      (NEW.resident_id, NEW.medecin_id, v_date, 30, 'planifie', NEW.id);

  elsif v_statut = 'planifie' then
    -- Le RDV n'a pas encore été pris en main : il suit la consultation
    update rendez_vous
       set date_rdv    = v_date,
           medecin_id  = NEW.medecin_id,
           resident_id = NEW.resident_id
     where id = v_rdv_id;
  end if;

  return NEW;
end;
$$;

comment on function public.fn_sync_rdv_consultation() is
  'Matérialise consultations.prochain_rdv en ligne rendez_vous. SECURITY DEFINER : le RDV doit naître même si la RLS de l''auteur ne couvre pas rendez_vous.';

drop trigger if exists trg_sync_rdv_consultation on public.consultations;

create trigger trg_sync_rdv_consultation
  after insert or update of prochain_rdv, medecin_id, resident_id
  on public.consultations
  for each row
  execute function public.fn_sync_rdv_consultation();

-- ── 3. Vue de détail : exposer consultation_id ──────────────

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
       r.nom            as resident_nom,
       r.prenom         as resident_prenom,
       r.numero_chambre,
       r.niveau_priorite,
       d.titre          as medecin_titre,
       d.nom            as medecin_nom,
       d.prenom         as medecin_prenom,
       rv.consultation_id          -- en dernier : contrainte de create or replace view
  from rendez_vous rv
  join residents r on rv.resident_id = r.id
  left join doctors d on rv.medecin_id = d.id
 order by rv.date_rdv;

-- ── 4. Rattrapage des consultations déjà saisies ────────────
--  Les demandes dont la date est déjà passée sont créées elles
--  aussi, en « planifié » : elles ont bien été demandées et
--  jamais honorées. Au personnel de les solder (effectué /
--  absent / annulé) depuis la vue Rendez-vous.

insert into public.rendez_vous
  (resident_id, medecin_id, date_rdv, duree_minutes, statut, consultation_id)
select c.resident_id,
       c.medecin_id,
       (c.prochain_rdv + time '09:00') at time zone 'Indian/Mauritius',
       30,
       'planifie',
       c.id
  from public.consultations c
 where c.prochain_rdv is not null
   and not exists (
     select 1 from public.rendez_vous r where r.consultation_id = c.id
   );

commit;

-- ── Vérification ────────────────────────────────────────────

select 'consultations avec prochain_rdv' as controle,
       count(*)::text as valeur
  from consultations where prochain_rdv is not null
union all
select 'rendez-vous liés à une consultation',
       count(*)::text from rendez_vous where consultation_id is not null
union all
select 'demandes non matérialisées (doit être 0)',
       count(*)::text
  from consultations c
 where c.prochain_rdv is not null
   and not exists (select 1 from rendez_vous r where r.consultation_id = c.id)
union all
select 'RDV futurs visibles dans « Prochains rendez-vous »',
       count(*)::text
  from rendez_vous
 where date_rdv > now() and statut in ('planifie','confirme');
