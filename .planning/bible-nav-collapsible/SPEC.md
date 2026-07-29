# SPEC: Bible Nav Collapsible Mobile

## Contexto

O modulo de Biblia do PIANO Web tem 3 paineis: livros, capitulos e versiculos.
No desktop (>768px) os 3 ficam visiveis lado a lado. No mobile (<=768px) todos
aparecem empilhados, ocupando espaco excessivo.

## Problema

No mobile, o usuario precisa rolar muito pra navegar entre livros, capitulos e
versiculos. Os paineis de livros e capitulos competem por espaco com o painel
de versiculos (que e o conteudo principal).

## Solucao

Tornar os paineis de **livros** e **capitulos** colapsaveis no mobile
(<=768px). O fluxo:

1. Usuario abre painel de livros -> seleciona livro -> painel colapsa
2. Painel de capitulos abre automaticamente -> seleciona capitulo -> colapsa
3. Versiculos aparecem (sempre visiveis, nunca colapsam)

### Comportamento detalhado

- Desktop (>768px): SEM MUDANCA. Tudo como esta hoje.
- Mobile (<=768px):
  - Painel de livros: colapsavel, auto-colapsa ao selecionar um livro
  - Painel de capitulos: colapsavel, auto-colapsa ao selecionar um capitulo
  - Painel de versiculos: SEMPRE visivel
  - Apenas um painel de navegacao aberto por vez (livros OU capitulos, nunca ambos)
  - Ao selecionar livro: colapsa livros, abre capitulos
  - Ao selecionar capitulo: colapsa capitulos, versiculos ficam visiveis

### Estados visuais

- Painel colapsado: header com titulo (ex: "Livros > Genesis") + icone chevron
- Painel expandido: lista completa de livros ou capitulos
- Indicador visual do item selecionado no header colapsado

## Requisitos Funcionais

- RF-01: Paineis de livros e capitulos DEVEM ser colapsaveis no mobile (<=768px)
- RF-02: Auto-colapsar painel de livros ao selecionar um livro
- RF-03: Auto-abrir painel de capitulos ao selecionar um livro
- RF-04: Auto-colapsar painel de capitulos ao selecionar um capitulo
- RF-05: Painel de versiculos NUNCA colapsa
- RF-06: Desktop (>768px) mantem comportamento atual (sem collapse)
- RF-07: Header colapsado mostra o item selecionado atual
- RF-08: Apenas um painel de nav aberto por vez no mobile

## Fora de Escopo

- Mudancas no desktop
- Mudancas no painel de versiculos
- Animacoes complexas (manter simples, max-height transition)

## Arquivos Afetados

- `src/modules/bible/views/BibleView.vue` (layout state management)
- `src/modules/bible/components/BibleBookGrid.vue` (header colapsavel)
- `src/modules/bible/components/BibleChapterGrid.vue` (header colapsavel)
- Novo: posivel composable `useBibleNavCollapse` se logica ficar complexa

## Pitfalls

- O `BibleBookGrid.vue` ja tem `v-if="showNavPanel"` que controla visibilidade
- O collapse NAO pode usar `v-if` (remove do DOM) -- usar `v-show` ou max-height
- Manter scroll position quando o painel re-abre
- O grid ja tem tabs OT/NT -- o collapse e do painel TODO, nao das tabs internas
