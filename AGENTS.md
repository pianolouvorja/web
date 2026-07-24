# AGENTS.md — PIANO Web (Browser)

Convenções de código para este repositório (humanos e ferramentas de IA).

## Escopo

- Versão **browser** do PIANO — sem Electron, IPC ou `window.louvorja`.
- Responsividade mobile (viewport mínimo ~375px) é trabalhada **neste** repo.
- Multi-tela no browser: `window.open` + `BroadcastChannel` (ver `docs/context/multi-screen-web.md`).

## Stack

- Vue 3 — Composition API, `<script setup lang="ts">` (sem Options API)
- TypeScript strict, Vite, Pinia, Vue Router, Vue I18n
- Tailwind CSS v4 (tokens / `--ds-*`) + Vuetify quando já usado no projeto
- Tabler Icons (`ti-`) em código novo
- Fonte: Plus Jakarta Sans

## Estrutura de módulo

```
src/modules/<nome>/
├── components/
├── composables/
├── services/
├── stores/
├── types/
├── views/
├── routes.ts
└── locales/pt-BR.ts
```

## Nomenclatura

- Componentes Vue: `PascalCase.vue`
- Serviços: `kebab-case.ts`
- Composables: `useXxx.ts`
- Tipos: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`

## Padrões

- Props e emits tipados
- Preferir `ref` / `computed`; evitar `any` explícito
- Persistência: Component → Composable → Store → Preferences Service → storage (não gravar direto no `localStorage` fora dos services)
- i18n pt-BR com `$t('chave')` — sem textos de UI hardcoded
- Visual reutilizável em `src/design-system/`; domínio compartilhado em `src/shared/`
- Layouts em `src/layouts/` compõem o design-system

## Cuidados

- `slot` de popup ≠ `displayId` do app desktop
- Canais `BroadcastChannel` são isolados por nome
- Tailwind v4 ≠ v3 — validar classes/tokens do tema
- Ao portar do desktop: manter nomes; adaptar só a plataforma (sem IPC)

## Mensagens de commit

Padrão **Conventional Commits** em português (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, …).  
Resumo curto no imperativo, focando no efeito — detalhes e exemplos em `docs/checklists/commit-messages.md`.

## Documentação pública

- Guia: `docs/DEVELOPER.md`
- Contexto: `docs/context/`
- Produto / design: `docs/prd/`
- Commits: `docs/checklists/commit-messages.md`
- PR: `docs/checklists/pr-checklist.md`
- Release: `docs/checklists/release-checklist.md`
