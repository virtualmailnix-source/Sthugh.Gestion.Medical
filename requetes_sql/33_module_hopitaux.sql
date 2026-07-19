-- ============================================================
--  33_module_hopitaux.sql
--  St Hugh's Anglican Home - Lot I des MAJ du 19/07/2026
--  Point 6 : module Hopitaux, le dernier lot.
--
--  Decisions de l'utilisateur :
--  - annuaire ET rattachements : les etablissements saisis en
--    texte libre aux lots E et F deviennent des references ;
--  - les medecins sont rattaches eux aussi (le champ clinique
--    etait du texte libre) ;
--  - l'annuaire demarre VIDE, sans reprise des textes existants.
--
--  Consequence de ce dernier point : les colonnes texte
--  (rendez_vous.etablissement, residents.etablissement_sante,
--  doctors.clinique) sont CONSERVEES. Les vues renvoient le nom
--  de l'annuaire quand une fiche est rattachee, le texte libre
--  sinon. Rien ne disparait de l'ecran pendant que l'annuaire se
--  remplit, et la saisie libre reste possible cote interface.
--
--  Cle etrangere en ON DELETE SET NULL : supprimer une fiche ne
--  doit jamais effacer un rendez-vous ni un dossier.
-- ============================================================

begin;

create table if not exists public.hopitaux (
  id         uuid primary key default gen_random_uuid(),
  nom        varchar(150) not null,
  type       varchar(20)  not null default 'hopital',
  secteur    varchar(10)  not null default 'public',
  adresse    text,
  telephone  varchar(40),
  telephone2 varchar(40),
  email      varchar(150),
  notes      text,
  actif      boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint hopitaux_type_check    check (type    in ('hopital','clinique','cabinet')),
  constraint hopitaux_secteur_check check (secteur in ('public','prive'))
);

comment on table public.hopitaux is
  'Annuaire des etablissements de sante. Reference par rendez_vous, residents (hospitalisation) et doctors.';

-- Deux fiches ne peuvent porter le meme nom, casse comprise
create unique index if not exists idx_hopitaux_nom on public.hopitaux (lower(nom));

alter table public.hopitaux enable row level security;
drop policy if exists hopitaux_read   on public.hopitaux;
drop policy if exists hopitaux_write  on public.hopitaux;
drop policy if exists hopitaux_delete on public.hopitaux;
create policy hopitaux_read   on public.hopitaux for select using (fn_is_app_user());
create policy hopitaux_write  on public.hopitaux for all    using (fn_is_medical_staff()) with check (fn_is_medical_staff());
create policy hopitaux_delete on public.hopitaux for delete using (fn_is_super_admin());

drop trigger if exists trg_audit_hopitaux on public.hopitaux;
create trigger trg_audit_hopitaux after insert or update or delete on public.hopitaux
  for each row execute function fn_audit_trigger();
drop trigger if exists trg_hopitaux_updated_at on public.hopitaux;
create trigger trg_hopitaux_updated_at before update on public.hopitaux
  for each row execute function fn_updated_at();

alter table public.rendez_vous add column if not exists hopital_id uuid references public.hopitaux(id) on delete set null;
alter table public.residents   add column if not exists hopital_id uuid references public.hopitaux(id) on delete set null;
alter table public.doctors     add column if not exists hopital_id uuid references public.hopitaux(id) on delete set null;

comment on column public.residents.hopital_id is
  'Etablissement d''hospitalisation, remplace etablissement_sante quand la fiche existe';
comment on column public.doctors.hopital_id is
  'Etablissement d''exercice, remplace le texte libre clinique quand la fiche existe';

alter table public.rendez_vous drop constraint if exists rendez_vous_cible_check;
alter table public.rendez_vous add constraint rendez_vous_cible_check
  check (medecin_id is not null or etablissement is not null or hopital_id is not null);

-- Les vues v_rdv_detail, v_residents_public et v_residents_priorite
-- sont recreees pour renvoyer coalesce(h.nom, <texte libre>).
-- Voir la migration appliquee : 33_module_hopitaux.

commit;

-- ── Verification ────────────────────────────────────────────

select 'table hopitaux' as controle,
       coalesce((select 'CREEE' from information_schema.tables
                  where table_schema='public' and table_name='hopitaux'),'ABSENTE') as valeur
union all select 'politiques RLS',
  (select count(*)::text from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='hopitaux')
union all select 'colonnes hopital_id',
  (select count(*)::text from information_schema.columns where table_schema='public'
    and column_name='hopital_id' and table_name in ('rendez_vous','residents','doctors'))
union all select 'residents lisibles', (select count(*)::text from v_residents_priorite)
union all select 'rdv lisibles',       (select count(*)::text from v_rdv_detail);
