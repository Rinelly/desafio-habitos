# Desafio Nelly & Anne 💜

App para registrar o desafio de hábitos de 23/10 a 24/12/2026.

**Stack:** React + TypeScript + Vite + Sass + Supabase

## Como rodar

```bash
npm install
cp .env.example .env   # e preencha com a URL e a chave anon do Supabase
npm run dev
```

## Estrutura

```
supabase/01_banco.sql      → script do banco (Parte 1)
supabase/02_medidas.sql    → tabela de medidas (antes e depois)
src/
  lib/supabase.ts          → conexão com o Supabase
  lib/desafio.ts           → datas do desafio (dia X de 63, semanas, fuso de Maceió)
  contexts/AuthContext.tsx → login, sessão e participantes
  components/              → Layout (topo + menu), RotaProtegida, Carregando
  lib/api.ts               → todas as chamadas ao banco
  hooks/                   → useMetas, useRegistrosDaSemana
  components/hoje/         → SeletorDia, PainelPessoa, LinhaMeta, ContadorAgua
  components/fotos/        → GradeFotos, AdicionarFoto, Visualizador
  lib/imagem.ts            → reduz a foto antes de enviar
  lib/resumo.ts            → regras de dia perfeito / falha / treinos da semana
  lib/placar.ts            → pontos, sequência, recorde e % por meta
  lib/medidas.ts           → campos de medidas e fotos de antes/depois
  components/evolucao/     → FormularioMedidas, Comparativo, FotosAntesDepois
  pages/                   → Entrar, Hoje, AcessoNegado, EmBreve
  styles/                  → tokens (cores, raios) e estilos globais
  types.ts                 → tipos das tabelas
```

## Partes

1. ✅ Banco de dados
2. ✅ Projeto, login e estrutura das telas
3. ✅ Tela "Hoje" (registrar metas e água)
4. ✅ Fotos
5. ✅ Calendário
6. ✅ Placar e sequência
   ✅ Evolução (medidas e fotos de antes e depois)
7. PWA e deploy
