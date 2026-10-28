-- =====================================================================
--  Desafio Nelly & Anne · Miniaturas das fotos (economiza egress)
--  Como rodar: Supabase > SQL Editor > New query > cole tudo > Run.
--  As fotos antigas ganham miniatura sozinhas: na próxima vez que a dona
--  abrir o app, ele gera e salva a miniatura de cada foto dela.
-- =====================================================================

alter table public.desafio_fotos add column if not exists miniatura text;
