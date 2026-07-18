-- ============================================================
--  30_constantes.sql
--  St Hugh's Anglican Home - Relevés datés des constantes
--  (points 2 et 3 des MAJ du 19/07/2026)
--
--  1. consultations.glycemie : la consultation enregistrait déjà
--     poids, pouls, tension, température et saturation, mais pas
--     la glycémie. Ajoutée pour que les deux sources portent les
--     mêmes paramètres.
--  2. Table constantes : relevés libres, à la fréquence voulue
--     (quotidienne ou ponctuelle), indépendants d'une
--     consultation. L'historique n'est jamais écrasé.
--  3. v_constantes_unifiees : relevés libres ET constantes
--     saisies en consultation, dans un seul flux trié par date.
--     C'est cette vue qui alimentera les courbes d'évolution.
--
--  UNITÉS retenues (usage mauricien) :
--    poids           kg
--    pouls           battements/minute
--    glycemie        mmol/L  (5 = valeur normale)
--    ta_systolique   mmHg    (le 120 de « 120/80 »)
--    ta_diastolique  mmHg    (le 80)
--    temperature     °C
--    saturation_o2   %
--
--  Aucune contrainte de plage n'est posée : le personnel doit
--  pouvoir enregistrer une valeur inhabituelle sans être bloqué.
--  La cohérence se vérifie à la saisie, côté interface.
-- ============================================================

begin;

-- ── 1. Glycémie en consultation ─────────────────────────────

alter table public.consultations
  add column if not exists glycemie numeric;

comment on column public.consultations.glycemie is 'Glycémie en mmol/L';

-- ── 2. Relevés datés ────────────────────────────────────────

create table if not exists public.constantes (
  id              uuid primary key default gen_random_uuid(),
  resident_id     uuid not null references public.residents(id) on delete cascade,
  date_releve     timestamptz not null default now(),
  poids           numeric,
  pouls           integer,
  glycemie        numeric,
  ta_systolique   integer,
  ta_diastolique  integer,
  temperature     numeric,
  saturation_o2   numeric,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.constantes is
  'Relevés datés des constantes d''un résident, hors consultation. Historique complet, jamais écrasé.';

create index if not exists idx_constantes_resident_date
  on public.constantes(resident_id, date_releve desc);

-- ── 3. Accès : même règle que les consultations ─────────────

alter table public.constantes enable row level security;

drop policy if exists constantes_read   on public.constantes;
drop policy if exists constantes_insert on public.constantes;
drop policy if exists constantes_update on public.constantes;
drop policy if exists constantes_delete on public.constantes;

create policy constantes_read   on public.constantes for select using (fn_is_medical_staff());
create policy constantes_insert on public.constantes for insert with check (fn_is_medical_staff());
create policy constantes_update on public.constantes for update using (fn_is_medical_staff()) with check (fn_is_medical_staff());
create policy constantes_delete on public.constantes for delete using (fn_is_super_admin());

-- Journal d'activité et horodatage, comme les autres tables
drop trigger if exists trg_audit_constantes on public.constantes;
create trigger trg_audit_constantes
  after insert or update or delete on public.constantes
  for each row execute function fn_audit_trigger();

drop trigger if exists trg_constantes_updated_at on public.constantes;
create trigger trg_constantes_updated_at
  before update on public.constantes
  for each row execute function fn_updated_at();

-- ── 4. Flux unifié pour les courbes ─────────────────────────
--  consultations.tension_arterielle est un texte libre : on ne
--  convertit que ce qui ressemble vraiment à « 120/80 ». Les
--  saisies fantaisistes deviennent NULL au lieu de faire échouer
--  la vue (des valeurs comme « cvcbc » existent déjà en base).

create or replace view public.v_constantes_unifiees
with (security_invoker = on) as
select k.id,
       k.resident_id,
       k.date_releve,
       'releve'::text as source,
       k.poids,
       k.pouls,
       k.glycemie,
       k.ta_systolique,
       k.ta_diastolique,
       k.temperature,
       k.saturation_o2,
       k.notes
  from public.constantes k
union all
select c.id,
       c.resident_id,
       c.date_consultation as date_releve,
       'consultation'::text,
       c.poids,
       c.pouls,
       c.glycemie,
       case when c.tension_arterielle ~ '^\s*\d{2,3}\s*/\s*\d{1,3}\s*$'
            then trim(split_part(c.tension_arterielle, '/', 1))::int end,
       case when c.tension_arterielle ~ '^\s*\d{2,3}\s*/\s*\d{1,3}\s*$'
            then trim(split_part(c.tension_arterielle, '/', 2))::int end,
       c.temperature,
       c.saturation_o2,
       c.observations
  from public.consultations c
 where c.poids is not null
    or c.pouls is not null
    or c.glycemie is not null
    or c.temperature is not null
    or c.saturation_o2 is not null
    or c.tension_arterielle is not null;

comment on view public.v_constantes_unifiees is
  'Relevés libres et constantes de consultation en un seul flux. Source de données des courbes d''évolution.';

commit;

-- ── Vérification ────────────────────────────────────────────

select 'table constantes' as controle,
       coalesce((select 'CREEE' from information_schema.tables where table_schema='public' and table_name='constantes'),'ABSENTE') as valeur
union all
select 'politiques RLS sur constantes',
       (select count(*)::text from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='constantes')
union all
select 'consultations.glycemie',
       coalesce((select 'AJOUTEE' from information_schema.columns where table_schema='public' and table_name='consultations' and column_name='glycemie'),'ABSENTE')
union all
select 'lignes dans v_constantes_unifiees',
       (select count(*)::text from v_constantes_unifiees)
union all
select 'tensions correctement decoupees',
       (select count(*)::text from v_constantes_unifiees where ta_systolique is not null);
