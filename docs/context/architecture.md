# Arquitetura — Web

## Visão geral

Aplicação Vue 3 + Vite (browser) com organização modular por feature — **espelhando** `StackVue/electron`, sem processo Electron.

- App Vue: `src/`
- Produto/design: `docs/prd/`
- Artefatos Stitch: `docs/stitch/`
- Contexto operacional: `docs/context/`
- Prompts: `docs/prompts/`

## Estrutura raiz

```
StackVue/web/
├── .cursor/             # Regras do agente Cursor
├── docs/
│   ├── prd/             # PRD, design system, mapeamento
│   ├── stitch/          # Exports do Stitch por tela
│   ├── context/         # Contexto operacional (IA + time)
│   └── prompts/         # Prompts reutilizáveis
├── src/                 # Aplicação Vue
├── public/
├── vite.config.ts
└── package.json
```

**Ausente de propósito (em relação ao Electron):** pasta `electron/` (main, preload, ipc).

## Estrutura `src/`

Mesma árvore do Electron (devem ser os mesmos nomes):

```
src/
├── app/                 # Bootstrap da aplicação
├── assets/              # Imagens, fontes, mídia estática
├── design-system/       # Linguagem visual (tokens, temas, primitivas)
├── layouts/             # Shell principal (compõe o design-system)
├── locales/             # Traduções globais
├── modules/             # Funcionalidades (features)
├── plugins/             # Vue plugins (Vuetify, i18n, etc.)
├── router/              # Router global (agrega rotas dos módulos)
├── shared/              # Código compartilhado NÃO visual (+ projeção popup)
└── styles/              # CSS/SCSS globais (ex.: entrada Tailwind)
```

## Design System

Camada da identidade visual do Stitch. Primitivas reutilizáveis — não colocar regra de negócio aqui.

```
design-system/
├── tokens/              # radius, primary, glass/blur, etc.
├── themes/              # Ethereal Lumens / Luminous Clarity
├── animations/          # dock lift/scale, theme transitions
├── composables/         # useThemeManager, useBlurSystem
└── components/
    ├── glass/           # GlassCard, BlurContainer
    ├── navigation/      # DockFooter, BottomNavigation
    └── backgrounds/     # GradientBackground, ProjectionBackground
```

Alias: `@design-system`.  
`@themes` aponta para `src/design-system/themes`.

`layouts/` consome esses componentes (ex.: shell usa `DockFooter`).  
Módulos e `shared/` não reimplementam glass/dock/gradient.

## Shared

Código compartilhado entre módulos **sem** ser linguagem visual:

```
shared/
├── components/          # widgets de domínio/app (ex.: PopupScreenControls)
├── composables/
├── services/            # I/O web + stack de popups/projeção
├── views/               # hosts compartilhados (ex.: PopupHost)
├── types/
├── constants/
└── utils/
```

Services que no Electron falavam com IPC devem, na web, usar APIs do browser (persistência local, HTTP, etc.).

**Projeção / multi-telas:** ver `docs/context/multi-screen-web.md` — não espelhar monitores nativos do Electron.

## Módulo (padrão interno)

```
modules/<nome>/
├── components/
├── composables/
├── services/
├── stores/
├── types/
├── locales/
├── views/               # inclui *ProjectionView quando o módulo projeta
└── routes.ts
```

Módulos presentes: `home`, `liturgy`, `bible`, `clock`, `countdown`, `random`, `draw`, `timer`, `settings`.  
Nav do PRD → pastas: `docs/prd/MODULE_MAPPING.md`.

## Adaptações web (vs Electron)

| Electron | Web |
|----------|-----|
| `electron/main`, `preload`, `ipc/` | Removidos — não existem |
| Bridge `window.louvorja` / preload | Services web (`localStorage`, `fetch`, Web APIs) |
| Router hash (`file://`) | History mode (ou hash se deploy exigir) |
| `base: './'` para pacote local | `base` adequado ao host (ex. `/`) |
| Scripts `electron:*` | Apenas `dev` / `build` / `preview` |
| Multi-telas / monitores nativos | Popups + `PopupHost` (`multi-screen-web.md`) |

## Aliases Vite

| Alias | Caminho |
|-------|---------|
| `@` | `src/` |
| `@app` | `src/app` |
| `@modules` | `src/modules` |
| `@shared` | `src/shared` |
| `@design-system` | `src/design-system` |
| `@layouts` | `src/layouts` |
| `@plugins` | `src/plugins` |
| `@themes` | `src/design-system/themes` |
| `@assets` | `src/assets` |
| `@styles` | `src/styles` |
| `@locales` | `src/locales` |

## Responsabilidades por camada

| Camada | Responsabilidade |
|--------|------------------|
| `design-system/` | Tokens, temas, animações e primitivas visuais |
| `layouts/` | Shell da app (compõe design-system + router-view) |
| `views/` | Orquestração de UI do módulo; mínimo de lógica |
| `components/` (módulo) | UI específica da feature |
| `shared/` | Código/app compartilhado não visual (ou widgets de domínio) + popups |
| `composables/` | Lógica reutilizável reativa |
| `services/` | I/O, persistência web, HTTP, abertura de popups |
| `stores/` | Estado compartilhado (Pinia) |
| `types/` | Contratos TypeScript |
| `plugins/` | Integração de libs no Vue |

## Fluxo de rotas

1. Cada módulo exporta rotas em `routes.ts`
2. `src/router/` importa e registra as rotas dos módulos
3. Views dos módulos usam o layout em `layouts/`
4. Rota compartilhada `/popup` → `PopupHost` (janelas de projeção)
