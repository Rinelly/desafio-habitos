-- =====================================================================
--  Desafio Nelly & Anne · Comentários nas fotos
--  Como rodar: Supabase > SQL Editor > New query > cole tudo > Run.
-- =====================================================================

create table if not exists public.desafio_comentarios (
  id        uuid primary key default gen_random_uuid(),
  foto_id   uuid not null references public.desafio_fotos(id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  texto     text not null check (char_length(trim(texto)) between 1 and 500),
  criado_em timestamptz not null default now()
);

create index if not exists desafio_comentarios_foto_idx on public.desafio_comentarios (foto_id, criado_em);

alter table public.desafio_comentarios enable row level security;

drop policy if exists "desafio: ver comentarios"    on public.desafio_comentarios;
drop policy if exists "desafio: criar comentario"   on public.desafio_comentarios;
drop policy if exists "desafio: apagar comentario"  on public.desafio_comentarios;

-- As duas leem e comentam em qualquer foto; cada uma só apaga o próprio comentário
create policy "desafio: ver comentarios" on public.desafio_comentarios
  for select to authenticated using (public.desafio_eh_participante());
create policy "desafio: criar comentario" on public.desafio_comentarios
  for insert to authenticated
  with check (user_id = auth.uid() and public.desafio_eh_participante());
create policy "desafio: apagar comentario" on public.desafio_comentarios
  for delete to authenticated using (user_id = auth.uid());
