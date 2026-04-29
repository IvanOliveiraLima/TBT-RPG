# TBT-RPG v2

Reescrita do TBT-RPG em React + TypeScript + Tailwind CSS.

## Dev

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/
npm run preview   # preview em http://localhost:4173
npm run lint      # ESLint
npm run test      # Vitest (single run)
npm run test:watch
```

## Sobre a v2

- **Stack:** React 19, TypeScript 6, Tailwind CSS 3, Vite 8, Zustand 4, idb 8, Supabase JS 2
- **DB:** Lê do IndexedDB da v1 (`dnd-character-sheet`) + escreve no próprio (`dnd-character-sheet-v2`)
- **Auth:** mesmo projeto Supabase da v1 — a mesma conta funciona nas duas versões
- **Env:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `.env.local` (mesmo arquivo da v1)

## Referência visual

Os arquivos de design estão em `design-reference/tbt-rpg/project/` (na raiz do monorepo):
- `TBT-RPG Redesign.html` — visão geral do protótipo
- `components/tokens.css` — tokens de design
- `components/char-select.jsx` — tela inicial (fonte de verdade do visual)
- `components/primitives.jsx` — componentes base
- `components/data.jsx` — estrutura de dados do protótipo

Esses arquivos estão no `.gitignore` — em novas sessões de Claude Code, informe onde encontrá-los caso não estejam presentes.

## Fases

| Fase | Status | Escopo |
|------|--------|--------|
| A (Fundação) | ✅ | Setup, tipos, tela de seleção, auth |
| B | Planejado | Ficha completa de personagem |
| C | Planejado | Sync, magias, notas avançadas |
