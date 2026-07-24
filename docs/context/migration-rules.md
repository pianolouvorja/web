# Regras de Migração — Electron → Web

## Princípio central

O projeto **`StackVue/electron`** (Electron **novo**) é a **única fonte** de clone/migração.

Ao migrar, **mantenha os mesmos nomes** de módulos, pastas, arquivos, funções, classes, variáveis, constantes, stores, composables, services, components e assets — o mesmo autor mantém os dois projetos e a paridade de nomes reduz atrito.

O que muda é o **runtime**: browser em vez de Electron. Adaptar apenas o que depende do shell desktop.

## Fonte permitida vs proibida

| Papel | Caminho | Regra |
|-------|---------|-------|
| **Origem (única)** | `StackVue/electron` | Consultar, espelhar estrutura e nomes |
| **Destino** | `StackVue/web` | Este projeto |
| **Proibido** | `Legado/StackVue/electron`, `Legado/StackVue/web`, qualquer `Legado/` | **Não** usar como referência de código, nomes ou arquitetura |

Escopo: `docs/context/project-context.md`.

## Exceção crítica: multi-telas / projeção

O multi-telas do Electron (**monitores nativos**, `MultiScreenSelectCard`, displays estendidos) é **incompatível** com o browser.

Na Web o recurso **já está feito** (popups + `BroadcastChannel` + `PopupHost`).  
Sempre que a migração tocar multi-telas, monitores, popups de projeção ou arquivos `MultiScreen*`:

1. **Não** portar a implementação do Electron.
2. **Reutilizar** a stack web documentada em `docs/context/multi-screen-web.md`.
3. Manter nomes de domínio do módulo (ex.: `toggleProjection`) e conectar à API web (`openPopupModule`, etc.).

## O que reutilizar (permitido e desejável)

- Árvore de pastas de `src/` (mesmos nomes)
- Nomes de arquivos, componentes, stores, composables, services, types, constantes
- Assets (logo, ícones, mídia) — copiar/espelhar
- Design system, layouts, módulos, locales (exceto peças de multi-tela nativa)
- Regras de negócio e fluxos funcionais (o *quê* projetar, não *como* abrir a tela)
- Contratos TypeScript e estrutura Pinia / Vue Router / i18n

## O que NÃO trazer / o que adaptar

| Do Electron | Na Web |
|-------------|--------|
| Pasta `electron/` (main, preload, ipc) | **Não criar** |
| `window.louvorja` / contextBridge | Services com APIs web |
| IPC tipado | Substituir por `localStorage`, IndexedDB, `fetch`, etc. |
| APIs Node no processo | Remover; usar apenas APIs do browser |
| Scripts `electron:dev` / `electron:build` | Remover do `package.json` web |
| Dependências `electron`, `electron-builder` | Não instalar |
| `base: './'` só por causa do `file://` | Configurar `base` para o host web |
| Router hash obrigatório pelo Electron | Preferir history no browser (ajustar se o deploy exigir) |
| Multi-telas / monitores / `MultiScreen*` | Usar stack em `multi-screen-web.md` |

## Padrões obrigatórios no código web

1. **Composition API** (`<script setup>` / composables)
2. **TypeScript** tipado (interfaces/DTOs em `types/`)
3. **i18n** — textos de UI via Vue I18n, nunca hardcoded
4. **Tailwind apenas para layout**; tokens/temas/animações em `src/design-system/`
5. **Vuetify** para componentes ricos
6. **Pinia** para estado (stores por módulo quando possível)
7. **Arquitetura modular** — feature isolada em `modules/<nome>/`
8. **Código desacoplado** — services e composables fora das views
9. **Primitivas visuais** em `design-system/`; widgets de domínio em `shared/`
10. **Sem Electron** — nenhum import de APIs Node/Electron no app Vue
11. **Paridade de nomes** com `StackVue/electron` (exceto renomes forçados por plataforma)
12. **Multi-telas só via stack web** — ver `multi-screen-web.md`

## Nomenclatura

- **Deve** seguir a nomenclatura de `StackVue/electron` (mesmos identificadores)
- Stores: `useXxxStore`
- Composables: `useXxx`
- Services: `xxxService` ou funções nomeadas por ação
- Só renomear quando o nome for inseparável de Electron (ex.: `electronThemeBridge` → equivalente web com nome claro) **ou** quando for peça de multi-tela nativa substituída pela stack web (`MultiScreenSelectCard` → `PopupScreensCard`, etc.)

## Processo sugerido por feature / clone

1. Localizar a feature **somente** em `StackVue/electron`
2. Copiar/espelhar estrutura e nomes para `StackVue/web`
3. Se houver multi-telas / projeção de janela: aplicar `docs/context/multi-screen-web.md` (não portar Electron)
4. Remover ou substituir pontos de IPC / Node / preload
5. Implementar o equivalente web no `services/` (ou shared)
6. Validar rotas, i18n, tipagem e build no browser
7. Conferir que não restou dependência de Electron nem referência a `Legado/`

## Qualidade

- Preferir mudanças pequenas e focadas na camada de adaptação
- Manter módulos independentes o máximo possível
- Evitar dependências circulares entre módulos
- Shared só para o que for genuinamente compartilhado
- Não reintroduzir Options API nem Vuex
