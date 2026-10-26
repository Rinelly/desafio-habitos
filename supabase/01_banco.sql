-- =====================================================================
--  Desafio Nelly & Anne · 23/10 a 24/12/2026
--  PARTE 1 — Banco de dados (Supabase)
--
--  Como rodar: Supabase > SQL Editor > New query > cole tudo > Run.
--  Pode rodar de novo sem medo: o script é idempotente.
--  Todas as tabelas têm prefixo "desafio_" para não misturar com o Pomodoro.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) PARTICIPANTES — só esses e-mails enxergam e gravam dados do desafio
--    (importante porque o projeto Supabase é o mesmo do Pomodoro)
-- ---------------------------------------------------------------------
create table if not exists public.desafio_participantes (
  email    text primary key,
  nome     text not null,
  cor      text not null default '#6c5ce7',
  user_id  uuid unique references auth.users(id) on delete set null
);

-- >>> TROQUE o e-mail da Anne antes de rodar <<<
insert into public.desafio_participantes (email, nome, cor) values
  ('rinellyvasconcelos@gmail.com', 'Nelly', '#6c5ce7'),
  ('EMAIL_DA_ANNE@exemplo.com',    'Anne',  '#e17055')
on conflict (email) do update set nome = excluded.nome, cor = excluded.cor;

-- Se alguma de vocês já tem conta (ex.: do Pomodoro), já vincula agora
update public.desafio_participantes p
   set user_id = u.id
  from auth.users u
 where lower(u.email) = lower(p.email)
   and p.user_id is null;

-- Função usada pelas regras de segurança: "quem está logado é participante?"
create or replace function public.desafio_eh_participante()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.desafio_participantes
     where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- O app chama isso logo após o login para vincular o user_id ao e-mail
create or replace function public.desafio_vincular_usuario()
returns void
language sql security definer set search_path = public
as $$
  update public.desafio_participantes
     set user_id = auth.uid()
   where lower(email) = lower(auth.jwt() ->> 'email')
     and user_id is null;
$$;


-- ---------------------------------------------------------------------
-- 2) METAS — configuráveis: para adicionar uma meta nova depois,
--    é só inserir uma linha aqui (o app monta a tela a partir desta tabela)
-- ---------------------------------------------------------------------
create table if not exists public.desafio_metas (
  chave         text primary key,
  titulo        text not null,
  categoria     text not null check (categoria in ('alimentacao', 'agua', 'treino', 'lembrete')),
  tipo          text not null default 'check' check (tipo in ('check', 'quantidade')),
  alvo          numeric,            -- ex.: 3 (litros)
  unidade       text,               -- ex.: 'L'
  frequencia    text not null default 'diaria' check (frequencia in ('diaria', 'semanal')),
  meta_semanal  int,                -- ex.: 5 treinos por semana
  ordem         int  not null default 0,
  ativa         boolean not null default true
);

insert into public.desafio_metas
  (chave, titulo, categoria, tipo, alvo, unidade, frequencia, meta_semanal, ordem) values
  ('zero_acucar',          'Zero açúcar',           'alimentacao', 'check',      null, null, 'diaria',  null, 1),
  ('zero_refrigerante',    'Zero refrigerante',     'alimentacao', 'check',      null, null, 'diaria',  null, 2),
  ('zero_gluten',          'Zero glúten',           'alimentacao', 'check',      null, null, 'diaria',  null, 3),
  ('zero_lactose',         'Zero lactose',          'alimentacao', 'check',      null, null, 'diaria',  null, 4),
  ('zero_ultraprocessados','Zero ultraprocessados', 'alimentacao', 'check',      null, null, 'diaria',  null, 5),
  ('agua',                 'Água (mín. 2,5L)',      'agua',        'quantidade', 2.5,  'L',  'diaria',  null, 6),
  ('treino',               'Treino',                'treino',      'check',      null, null, 'semanal', 5,    7),
  ('cardio',               'Cardio',                'treino',      'check',      null, null, 'diaria',  null, 8),
  ('abdominal',            'Abdominal',             'treino',      'check',      null, null, 'diaria',  null, 9),
  ('vacuum',               'Vacuum',                'lembrete',    'check',      null, null, 'diaria',  null, 10)
on conflict (chave) do update set
  titulo = excluded.titulo, categoria = excluded.categoria, tipo = excluded.tipo,
  alvo = excluded.alvo, unidade = excluded.unidade, frequencia = excluded.frequencia,
  meta_semanal = excluded.meta_semanal, ordem = excluded.ordem;


-- ---------------------------------------------------------------------
-- 3) REGISTROS — um por pessoa, por dia, por meta (cumpriu / falhou)
-- ---------------------------------------------------------------------
create table if not exists public.desafio_registros (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dia           date not null check (dia between date '2026-10-23' and date '2026-12-24'),
  meta          text not null references public.desafio_metas(chave) on update cascade,
  status        text not null check (status in ('cumpriu', 'falhou')),
  valor         numeric,            -- usado na água (litros bebidos)
  atualizado_em timestamptz not null default now(),
  unique (user_id, dia, meta)
);

create index if not exists desafio_registros_dia_idx on public.desafio_registros (dia);

create or replace function public.desafio_tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists desafio_registros_atualizado on public.desafio_registros;
create trigger desafio_registros_atualizado
  before update on public.desafio_registros
  for each row execute function public.desafio_tocar_atualizado_em();


-- ---------------------------------------------------------------------
-- 4) FOTOS — várias por dia, com legenda opcional
--    (o arquivo fica no Storage; aqui guardamos só o caminho)
-- ---------------------------------------------------------------------
create table if not exists public.desafio_fotos (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dia       date not null check (dia between date '2026-10-23' and date '2026-12-24'),
  caminho   text not null unique,   -- ex.: '<user_id>/2026-10-23/abc.jpg'
  legenda   text check (char_length(legenda) <= 200),
  criado_em timestamptz not null default now()
);

create index if not exists desafio_fotos_dia_idx on public.desafio_fotos (dia);


-- ---------------------------------------------------------------------
-- 5) SEGURANÇA (RLS)
--    • As duas VEEM tudo do desafio (para acompanhar uma à outra)
--    • Cada uma só CRIA / EDITA / APAGA o que é seu
-- ---------------------------------------------------------------------
alter table public.desafio_participantes enable row level security;
alter table public.desafio_metas         enable row level security;
alter table public.desafio_registros     enable row level security;
alter table public.desafio_fotos         enable row level security;

-- participantes
drop policy if exists "desafio: ver participantes" on public.desafio_participantes;
create policy "desafio: ver participantes" on public.desafio_participantes
  for select to authenticated using (public.desafio_eh_participante());

-- metas (só leitura pelo app)
drop policy if exists "desafio: ver metas" on public.desafio_metas;
create policy "desafio: ver metas" on public.desafio_metas
  for select to authenticated using (public.desafio_eh_participante());

-- registros
drop policy if exists "desafio: ver registros"     on public.desafio_registros;
drop policy if exists "desafio: criar registro"    on public.desafio_registros;
drop policy if exists "desafio: editar registro"   on public.desafio_registros;
drop policy if exists "desafio: apagar registro"   on public.desafio_registros;

create policy "desafio: ver registros" on public.desafio_registros
  for select to authenticated using (public.desafio_eh_participante());
create policy "desafio: criar registro" on public.desafio_registros
  for insert to authenticated
  with check (user_id = auth.uid() and public.desafio_eh_participante());
create policy "desafio: editar registro" on public.desafio_registros
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "desafio: apagar registro" on public.desafio_registros
  for delete to authenticated using (user_id = auth.uid());

-- fotos (tabela)
drop policy if exists "desafio: ver fotos"    on public.desafio_fotos;
drop policy if exists "desafio: criar foto"   on public.desafio_fotos;
drop policy if exists "desafio: editar foto"  on public.desafio_fotos;
drop policy if exists "desafio: apagar foto"  on public.desafio_fotos;

create policy "desafio: ver fotos" on public.desafio_fotos
  for select to authenticated using (public.desafio_eh_participante());
create policy "desafio: criar foto" on public.desafio_fotos
  for insert to authenticated
  with check (user_id = auth.uid() and public.desafio_eh_participante());
create policy "desafio: editar foto" on public.desafio_fotos
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "desafio: apagar foto" on public.desafio_fotos
  for delete to authenticated using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 6) STORAGE — bucket privado para as fotos (máx. 5 MB, só imagens)
--    Cada uma grava apenas na própria pasta: <user_id>/...
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('desafio-fotos', 'desafio-fotos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "desafio-fotos: ver"    on storage.objects;
drop policy if exists "desafio-fotos: enviar" on storage.objects;
drop policy if exists "desafio-fotos: apagar" on storage.objects;

create policy "desafio-fotos: ver" on storage.objects
  for select to authenticated
  using (bucket_id = 'desafio-fotos' and public.desafio_eh_participante());

create policy "desafio-fotos: enviar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'desafio-fotos'
    and public.desafio_eh_participante()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "desafio-fotos: apagar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'desafio-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- 7) CONFERÊNCIA — rode depois e veja se aparecem 9 metas e 2 participantes
-- ---------------------------------------------------------------------
-- select * from public.desafio_metas order by ordem;  (10 linhas: 9 metas + o lembrete do vacuum)
-- select email, nome, user_id from public.desafio_participantes;
