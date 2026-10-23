-- =====================================================================
--  Desafio Nelly & Anne · PARTE extra — Medidas (antes e depois)
--
--  Como rodar: Supabase > SQL Editor > New query > cole tudo > Run.
--  Pode rodar de novo sem medo (idempotente).
--  As fotos usam o mesmo bucket "desafio-fotos" (pasta <user_id>/medidas/...).
-- =====================================================================

create table if not exists public.desafio_medicoes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- aceita uma semana antes/depois do desafio, para quem medir antes de começar
  dia             date not null check (dia between date '2026-10-16' and date '2026-12-31'),
  peso            numeric(5,2) check (peso between 20 and 300),          -- kg
  cintura         numeric(5,1) check (cintura between 20 and 250),       -- cm
  quadril         numeric(5,1) check (quadril between 20 and 250),
  abdomen         numeric(5,1) check (abdomen between 20 and 250),
  busto           numeric(5,1) check (busto between 20 and 250),
  braco           numeric(5,1) check (braco between 5 and 100),
  coxa            numeric(5,1) check (coxa between 10 and 150),
  gordura_pct     numeric(4,1) check (gordura_pct between 1 and 80),     -- %
  massa_muscular  numeric(5,2) check (massa_muscular between 5 and 150), -- kg
  foto_frente     text,
  foto_lado       text,
  foto_costas     text,
  observacao      text check (char_length(observacao) <= 500),
  criado_em       timestamptz not null default now(),
  unique (user_id, dia)
);

alter table public.desafio_medicoes enable row level security;

drop policy if exists "desafio: ver medicoes"    on public.desafio_medicoes;
drop policy if exists "desafio: criar medicao"   on public.desafio_medicoes;
drop policy if exists "desafio: editar medicao"  on public.desafio_medicoes;
drop policy if exists "desafio: apagar medicao"  on public.desafio_medicoes;

-- As duas veem tudo; cada uma só mexe no que é seu
create policy "desafio: ver medicoes" on public.desafio_medicoes
  for select to authenticated using (public.desafio_eh_participante());
create policy "desafio: criar medicao" on public.desafio_medicoes
  for insert to authenticated
  with check (user_id = auth.uid() and public.desafio_eh_participante());
create policy "desafio: editar medicao" on public.desafio_medicoes
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "desafio: apagar medicao" on public.desafio_medicoes
  for delete to authenticated using (user_id = auth.uid());

-- Conferência: deve listar a tabela vazia, sem erro
-- select * from public.desafio_medicoes;
