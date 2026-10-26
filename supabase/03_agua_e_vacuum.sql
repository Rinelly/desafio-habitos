-- =====================================================================
--  Desafio Nelly & Anne · Ajustes de 26/10
--  • Meta de água passa de 3 L para 2,5 L
--  • Novo lembrete diário "Vacuum" (só para marcar; não conta pontos)
--
--  Como rodar: Supabase > SQL Editor > New query > cole tudo > Run.
-- =====================================================================

-- 1) Permite a nova categoria "lembrete"
alter table public.desafio_metas drop constraint if exists desafio_metas_categoria_check;
alter table public.desafio_metas
  add constraint desafio_metas_categoria_check
  check (categoria in ('alimentacao', 'agua', 'treino', 'lembrete'));

-- 2) Água: 2,5 L
update public.desafio_metas
   set alvo = 2.5, titulo = 'Água (mín. 2,5L)'
 where chave = 'agua';

-- 3) Lembrete do vacuum
insert into public.desafio_metas
  (chave, titulo, categoria, tipo, alvo, unidade, frequencia, meta_semanal, ordem)
values
  ('vacuum', 'Vacuum', 'lembrete', 'check', null, null, 'diaria', null, 10)
on conflict (chave) do update set
  titulo = excluded.titulo, categoria = excluded.categoria, ordem = excluded.ordem;

-- 4) Dias já registrados: quem bebeu 2,5 L ou mais passa a contar como "cumpriu"
update public.desafio_registros
   set status = 'cumpriu'
 where meta = 'agua' and valor >= 2.5 and status = 'falhou';

-- Conferência: deve mostrar a água com alvo 2.5 e o vacuum como lembrete
-- select chave, titulo, categoria, alvo from public.desafio_metas order by ordem;
