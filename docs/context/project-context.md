# Contexto do Projeto — Web

## Nome

LouvorJA - PIANO Web (pacote: `louvorja-piano-web`, alinhado ao Electron `louvorja-piano`)

## Contexto

Aplicação **web** (navegador) para gerenciamento de culto — mesma linha de produto do desktop, sem shell Electron.

## Projeto base

| Papel | Caminho |
|-------|---------|
| **Única fonte de migração** | `StackVue/electron` (Electron **novo**) |
| **Este projeto** | `StackVue/web` |

A versão web parte do código e da arquitetura de `StackVue/electron`.  
Ao migrar, **manter os mesmos nomes** de arquivos, pastas, funções, classes, variáveis, constantes, assets e módulos.  
O trabalho de adaptação concentra-se em remover/substituir tudo que depende de Electron — e, no caso de multi-telas, usar a stack web já existente (`docs/context/multi-screen-web.md`).

### Fora de escopo

**Não** consultar `Legado/` (`Legado/StackVue/electron`, `Legado/StackVue/web` ou qualquer legado). A referência exclusiva é `StackVue/electron`.

## Objetivos

- Espelhar a arquitetura modular do Electron (com paridade de nomes)
- Versão exclusiva para browser (Vite + Vue, sem main/preload/IPC)
- Desenvolvimento orientado por IA
- Internacionalização
- Alto reaproveitamento de componentes e design system
- Mesma linguagem visual do projeto Electron
- Projeção multi-janela via popups web (não monitores nativos)

## Escopo (módulos)

| Módulo | Pasta | Função |
|--------|-------|--------|
| Home | `modules/home` | Tela inicial / hub |
| Álbuns / Liturgia | `modules/liturgy` | Biblioteca / conteúdo litúrgico |
| Bíblia | `modules/bible` | Leitura e projeção bíblica |
| Relógio | `modules/clock` | Relógio em projeção |
| Contagem | `modules/countdown` | Contagem regressiva / cronômetro de culto |
| Sorteio | `modules/random` | Sorteio em projeção |
| Desenho | `modules/draw` | Desenho / anotação |
| Timer | `modules/timer` | Contagem regressiva |
| Configurações | `modules/settings` | Preferências do app |

Módulos ainda só no Electron (ex.: `media`, `albums`, `starting`, `sync`) devem ser migrados sob demanda, com os **mesmos nomes** de pasta/módulo.  
Mapeamento nav → módulos: `docs/prd/MODULE_MAPPING.md`.

## Stack

| Tecnologia | Uso |
|------------|-----|
| Vue 3 | UI (Composition API) |
| TypeScript | Tipagem |
| Vite | Build e dev server |
| Vuetify | Componentes ricos |
| Tailwind | Layout apenas |
| Pinia | Estado |
| Vue Router | Rotas (history mode no browser) |
| Vue I18n | Internacionalização |

**Não faz parte deste projeto:** Electron, `electron-builder`, main process, preload, IPC.

## Documentação por responsabilidade

| Pasta / arquivo | Papel |
|-----------------|-------|
| `docs/prd/` | Fonte da verdade de produto/design (PRD, tokens, mapeamento) |
| `docs/stitch/` | Artefatos exportados do Stitch (prints, HTML, notas por tela) |
| `docs/context/` | Contexto operacional (projeto, front, arquitetura, migração, multi-telas) |
| `docs/prompts/` | Prompts reutilizáveis (`examples.md` = como perguntar à IA) |
| `.cursor/rules.md` | Regras curtas de execução no Cursor |

## Estado atual

- Documentação (`.cursor/` + `docs/`) alinhada à migração Electron → Web
- Bootstrap do código a partir de `StackVue/electron` (`src/`, `public/`, Vite, módulos, design system)
- Sem pasta `electron/`; router em history mode; bridge `window.louvorja` removida
- Multi-telas / projeção web já implementada (`popup-windows`, `PopupHost`, settings de popups)
- `npm install`, `type-check` e `build` validados
