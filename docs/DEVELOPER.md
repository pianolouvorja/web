# Guia do desenvolvedor — Web

Referência técnica da versão **web** do LouvorJA - PIANO.  
Use este arquivo para consulta de arquitetura, scripts e migração a partir do Electron.  
Para visão rápida do projeto, veja o [README na raiz](../README.md).

---

## Contexto

App **web** (navegador) para gerenciamento de culto: músicas, bíblia, utilitários e projeção.  
Clone/migração de `StackVue/electron` (Electron **novo**), com a mesma arquitetura Vue e design system — **sem** shell Electron.  
**Não** usar `Legado/` como referência.

### Em relação ao Electron (`StackVue/electron`)

| Electron | Web |
|----------|-----|
| Vue 3 + TS + Vite + Pinia + … | **Igual** (mesma stack de UI) |
| Pasta `electron/` + IPC | **Ausente** — APIs do browser |
| Scripts `electron:*` | Só `dev` / `build` / `preview` |
| Nomes de módulos/arquivos/funções | **Manter os mesmos** |
| Multi-telas (monitores nativos) | Popups + `PopupHost` (já pronto) |
| `base: './'` / hash por `file://` | Configuração de host web |

Regras detalhadas: `context/migration-rules.md`.  
Multi-telas: `context/multi-screen-web.md`.

---

## Stack

- **Vue 3** — Composition API (`<script setup>`)
- **TypeScript** — tipagem estrita
- **Vite** — build e HMR
- **Pinia** — estado
- **Vue Router** — rotas no browser
- **Vue I18n** — internacionalização
- **Vuetify** — componentes ricos
- **Tailwind CSS** — layout e utilitários
- **Design System** — tokens, temas, glass, dock (`src/design-system/`)

---

## Pré-requisitos e instalação

- Node.js `^22.18.0` ou `>=24.12.0` (alinhado ao Electron)

```bash
npm install
```

---

## Scripts

| Comando | Para quê |
|---------|----------|
| `npm run dev` | UI no browser (Vite) |
| `npm run host` | Vite acessível na rede local |
| `npm run build` | Type-check + build de produção |
| `npm run preview` | Preview do build |
| `npm run type-check` | Só `vue-tsc` |

Não há `electron:dev` / `electron:build` neste projeto.

---

## Estrutura

```
StackVue/web/
├── src/
│   ├── design-system/        # Tokens, temas, glass, dock, backgrounds
│   ├── layouts/              # Shell (header + dock + RouterView)
│   ├── modules/              # Features (home, bible, liturgy, …)
│   ├── shared/               # Código compartilhado + stack de popups
│   ├── router/               # Agrega rotas dos módulos (+ /popup)
│   ├── plugins/              # Vuetify, i18n, …
│   ├── locales/              # Traduções globais
│   ├── styles/               # Tailwind + base CSS
│   └── assets/               # Logo, mídia
├── docs/
│   ├── prd/                  # PRD, design system, mapeamento
│   ├── stitch/               # Referências visuais por tela
│   ├── context/              # Contexto operacional (incl. multi-screen-web)
│   ├── prompts/
│   └── DEVELOPER.md          # Este guia
├── public/
└── dist/
```

### Contrato de módulo

Igual ao Electron:

```
src/modules/<nome>/
├── components/
├── composables/
├── services/
├── stores/
├── types/
├── locales/
├── views/
└── routes.ts
```

Módulos atuais: `home`, `liturgy`, `bible`, `clock`, `countdown`, `random`, `draw`, `timer`, `settings`.

---

## Design System

Documentação canônica: `prd/DESIGN_SYSTEM.md` e `prd/FRONT_PRD.md`.

- Temas: **Ethereal Lumens** (escuro) e **Luminous Clarity** (claro)
- Navegação: footer estilo macOS Dock
- Glassmorphism, blur configurável, tokens tipados
- Primitivas: `GlassCard`, `DockFooter`, `GradientBackground`, …

Regras:

- Tailwind **só para layout**
- Vuetify **para componentes ricos**
- Glass / dock / gradient só via `@design-system`

---

## Migração Electron → Web

1. Espelhar `src/` (e assets) de `StackVue/electron` com **os mesmos nomes**
2. Remover dependências e scripts Electron
3. Substituir IPC / `window.louvorja` por services web
4. Se a feature usar multi-telas/projeção: seguir `context/multi-screen-web.md` (não portar monitores do Electron)
5. Ajustar Vite (`base`) e Vue Router para browser
6. Validar build e runtime no navegador

Detalhes: `context/migration-rules.md`.

---

## Índice da documentação

| Caminho | Conteúdo |
|---------|----------|
| `prd/` | PRD de front, design system, mapeamento de módulos |
| `stitch/` | Referências visuais por tela |
| `context/` | Arquitetura, migração, multi-telas web, contexto de projeto/front |
| `context/multi-screen-web.md` | Canônico: popups / projeção (não monitores Electron) |
| `prompts/` | Prompts reutilizáveis |
| `../.cursor/rules.md` | Regras curtas do agente Cursor |

---

## Estado atual

- Documentação (`.cursor/` + `docs/`) alinhada à migração a partir do Electron novo
- Código bootstrap e vários módulos migrados (sem shell desktop)
- Multi-telas / projeção web já disponível
- Home, design system, router e módulos de utilitários/bíblia em evolução

---

## Licença

Projeto privado — LouvorJA - PIANO.
