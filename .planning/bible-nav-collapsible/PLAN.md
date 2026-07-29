# PLAN: Bible Nav Collapsible Mobile

## TASK-01: Criar composable useBibleNavCollapse

**Status:** Draft

### Objetivo
Extrair logica de estado de colapso para um composable reutilizavel.

### Escopo
- Criar `src/modules/bible/composables/useBibleNavCollapse.ts`
- Estado: `activePanel: 'books' | 'chapters' | null`
- Metodos: `selectBook()`, `selectChapter()`, `togglePanel()`
- So ativa abaixo de 768px (usar `window.matchMedia`)
- Desktop retorna sempre `activePanel = null` (sem colapso)

### PRE-CONDITIONS
- `BibleView.vue` existe e funciona

### POST-CONDITIONS
- Composable exportado e tipado
- `window.matchMedia('(max-width: 768px)')` reativo

---

## TASK-02: Integrar collapse no BibleView

**Status:** Draft

### Objetivo
Conectar o composable na view principal.

### Escopo
- Importar `useBibleNavCollapse` em `BibleView.vue`
- Passar props `collapsed` e `activePanel` para BibleBookGrid e BibleChapterGrid
- No `@select-book`: chamar `selectBook()` do composable
- No `@select-chapter`: chamar `selectChapter()` do composable
- Desktop: props `collapsed = false` sempre

### PRE-CONDITIONS
- TASK-01 completo

### POST-CONDITIONS
- BibleView passa props corretas
- Selecionar livro no mobile abre capitulos e colapsa livros
- Selecionar capitulo colapsa capitulos

---

## TASK-03: Header colapsavel no BibleBookGrid

**Status:** Draft

### Objetivo
Adicionar header clicavel que mostra livro selecionado quando colapsado.

### Escopo
- Props novas: `collapsed: boolean`, `selectedBookName?: string`
- Emit novo: `toggle-collapse`
- Quando `collapsed = true`: mostrar header compacto com nome do livro + chevron
- Quando `collapsed = false`: comportamento atual (tabs + grid)
- `v-show` no conteudo, NAO `v-if`
- CSS: transicao max-height ou display none/block

### PRE-CONDITIONS
- TASK-01 e TASK-02 completos

### POST-CONDITIONS
- Header colapsado mostra "Genesis" (ou livro selecionado)
- Click no header expande o grid
- Grid funcional quando expandido

---

## TASK-04: Header colapsavel no BibleChapterGrid

**Status:** Draft

### Objetivo
Mesmo padrao do TASK-03 mas para capitulos.

### Escopo
- Props novas: `collapsed: boolean`, `selectedChapter?: number`
- Emit novo: `toggle-collapse`
- Quando `collapsed = true`: header compacto com "Capitulo X"
- Quando `collapsed = false`: comportamento atual (grid de capitulos)

### PRE-CONDITIONS
- TASK-03 completo

### POST-CONDITIONS
- Header colapsado mostra "Capitulo 1"
- Click no header expande o grid

---

## TASK-05: CSS responsivo do collapse

**Status:** Draft

### Objetivo
Estilizar headers colapsados e transicoes.

### Escopo
- Header colapsado: glass card compacto, padding menor, chevron rotacionado
- Transicao: max-height 200ms ease ou display toggle
- Indicador visual do painel ativo (borda ou bg diferente)
- Mobile only: `@media (max-width: 768px)`

### PRE-CONDITIONS
- TASK-03 e TASK-04 completos

### POST-CONDITIONS
- Visual limpo no mobile
- Sem regressao no desktop

---

## TASK-06: Build + verificacao

**Status:** Draft

### Objetivo
Garantir que nada quebrou.

### Escopo
- `pnpm run build` passa (type-check + vite)
- Verificacao visual: dev server + tunnel
- Desktop sem mudanca
- Mobile com collapse funcionando

### PRE-CONDITIONS
- TASK-01 a TASK-05 completos

### POST-CONDITIONS
- Build exit 0
- Type-check limpo
