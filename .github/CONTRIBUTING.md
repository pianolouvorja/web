# Contribuindo para o PIANO LouvorJA

Obrigado pelo interesse em contribuir! Este documento descreve o processo.

## Começando

1. Clone o repositório
2. Instale as dependências: `pnpm install`
3. Rode o projeto: `pnpm run dev`
4. Verifique o build: `pnpm run build`

## Branches

- `main` — produção (protegida)
- `staging` — homologação (PRs devem targetar esta branch)
- `feature/*` — novas features
- `fix/*` — correções de bug

**Regra**: Todo PR deve ter `staging` como base. Nunca abra PR direto para `main`.

## Issues

1. Antes de abrir uma issue, verifique se já existe uma similar
2. Use o template de issue (`.github/ISSUE_TEMPLATE/issue.yml`)
3. Inclua passos para reproduzir se for bug
4. Mencione o módulo afetado (bible, liturgy, media, etc.)

## Pull Requests

1. Crie uma branch a partir de `staging`: `git checkout staging && git pull && git checkout -b feature/minha-feature`
2. Faça commits atômicos com mensagens claras
3. Use o template de PR
4. Referencie a issue: `Closes #N`
5. Verifique se o build passa: `pnpm run build`
6. Verifique responsividade (mobile + desktop)

## Padrões de código

- **Framework**: Vue 3 + Vuetify 4 + TypeScript
- **Estilo**: Siga o padrão do CLAUDE.md
- **Responsividade**: Use `useDisplay` (Vuetify) para mostrar/ocultar elementos e `@media` queries para estilo. Breakpoints: 600px (sm), 960px (md), 1280px (lg)
- **Módulos**: Cada módulo está em `src/modules/<nome>/` com `routes.ts`, `views/`, `components/`, `stores/`
- **Design System**: Use tokens de `src/design-system/` — não invente valores

## Estrutura do projeto

```
src/
├── modules/          # Módulos de feature (bible, liturgy, media, etc.)
│   └── <module>/
│       ├── routes.ts
│       ├── views/
│       ├── components/
│       └── stores/
├── shared/           # Componentes e composables compartilhados
├── design-system/    # Tokens, componentes base (GlassCard, etc.)
├── layouts/          # Layouts (AppShell)
└── router/           # Configuração de rotas
```

## Fluxo de release

O projeto usa fluxo git-flow simplificado com homologação:

```
feature/x ──> PR ──> staging (homologação/teste)
                        │
                        │  PR de release (squash merge)
                        ▼
                      main (produção)
```

### Regras

1. **Todo PR targeta `staging`** — nunca abra PR direto para `main`
2. **`staging` é homologação** — teste tudo antes de promover
3. **Promoção para `main`** via PR com título `release: vX.Y.Z`
4. **Tags** seguem versionamento semântico (`v1.16.0`, `v1.16.1`, etc.)
5. **Squash merge** ao promover staging → main (história linear)

### Versionamento

Use os scripts NPM para bumpar a versão:

```bash
pnpm run version:patch   # 1.15.2 → 1.15.3 (bugfix)
pnpm run version:minor   # 1.15.2 → 1.16.0 (feature)
pnpm run version:major   # 1.15.2 → 2.0.0   (breaking change)
```

### CI/CD automático

O pipeline `.github/workflows/ci.yml` executa automaticamente:

- **Em todo PR/push para staging ou main:**
  - Lint (Biome)
  - Type Check (vue-tsc)
  - Build (Vite + PWA)
  - Quality Gate (bloqueia merge se algo falhar)

- **Push em `staging`:**
  - Deploy automático para `staging.pianolouvorja.com.br` (rsync via SSH)

- **Push em `main`:**
  - Deploy automático para `app.pianolouvorja.com.br` (rsync via SSH)

Branch protection exige que todos os status checks passem antes do merge.

### Responsabilidades

| Papel | Responsável |
|-------|-------------|
| Backend/Código | Rafael Zendron |
| Deploy/Servidor/Secrets | Ezequias Fonseira |
| Design UX | ElomarXA |
| Electron | Elias Vieira |
| Gerência TI | Eric |

## Dúvidas?

Abra uma issue com a label `question` ou entre em contato com a equipe.
