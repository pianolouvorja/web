# Mapeamento de Módulos — LouvorJA - PIANO Web

> Relaciona a navegação e telas do PRD de front com a arquitetura modular do código.  
> Nomes de pastas **idênticos** aos de `StackVue/electron` de propósito.  
> PRD: [FRONT_PRD.md](./FRONT_PRD.md) · Design: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)  
> Multi-telas: [multi-screen-web.md](../context/multi-screen-web.md)

## 1. Navegação principal → módulos

| Item do Footer (PRD) | Destino no código |
|----------------------|-------------------|
| Home / Início | `modules/home` |
| Bíblia | `modules/bible` |
| Utilitários | `modules/clock`, `modules/timer`, `modules/countdown`, `modules/random`, `modules/draw` |
| Álbuns | `modules/liturgy` (e, quando migrado, `modules/albums` / `modules/media`) |
| Configurações | `modules/settings` |

## 2. Utilitários (submódulos)

| Utilitário | Pasta | Projeta? |
|------------|-------|----------|
| Relógio | `modules/clock` | Sim → `ClockProjectionView` + `popup-windows` |
| Timer | `modules/timer` | Sim → `TimerProjectionView` |
| Contagem | `modules/countdown` | Sim → `CountdownProjectionView` |
| Sorteio | `modules/random` | Sim → `RandomProjectionView` |
| Desenho | `modules/draw` | Conforme feature |

## 3. Álbuns / mídia (Electron → migrar sob demanda)

| Item | Pasta no Electron | Nota na Web |
|------|-------------------|-------------|
| Álbuns / Liturgia | `modules/liturgy`, `modules/albums` | Manter mesmos nomes ao migrar |
| Mídia / Player | `modules/media` | Ainda não migrado; mesma pasta quando migrar |

## 4. Configurações

| Item do PRD | Pasta |
|-------------|-------|
| Configurações | `modules/settings` |

### Seções de UI (abas)

| Aba (PRD) | Responsabilidade sugerida |
|-----------|---------------------------|
| Aparência | Tema claro/escuro, blur/glassmorphism, brilho |
| Geral | Preferências gerais do app |
| Mídia & Player | Áudio/vídeo e player |
| Projeção & Telas | **Popups web** (quantidade de janelas), não monitores nativos |

Implementação: `ProjectionView` + `PopupScreensCard` + `ProjectionOptionsCard`.  
**Não** portar `MultiScreenSelectCard` do Electron. Ver [multi-screen-web.md](../context/multi-screen-web.md).

## 5. Shell, assets e projeção

| Conceito do PRD | Destino no código |
|-----------------|-------------------|
| Bottom navigation / shell | `src/layouts/` + `src/design-system/components/navigation/` |
| Temas Ethereal Lumens / Luminous Clarity | `src/design-system/themes/` |
| Glassmorphism, radius, cor primária | `src/design-system/tokens/` + `components/glass/` |
| Gradientes / backgrounds | `src/design-system/components/backgrounds/` |
| Logo e tipografia | `src/assets/` |
| Rotas agregadas | `src/router/` + `modules/*/routes.ts` |
| Host de projeção (multi-janela) | `shared/views/PopupHost.vue` + rota `/popup` |
| Abrir/fechar popups | `shared/services/popup-windows.ts` |
| Controles nos módulos | `shared/components/PopupScreenControls.vue` |

## 6. Estrutura interna de cada módulo

```
modules/<nome>/
├── components/
├── composables/
├── services/
├── stores/
├── types/
├── locales/
├── views/          # *View + *ProjectionView quando aplicável
└── routes.ts
```

## 7. Pendências de mapeamento

* Definir se **Utilitários** terá view hub própria ou apenas agrupamento na nav
* Alinhar nomes de rotas/i18n com os labels do footer do Stitch
* Migrar `media` / `albums` / `starting` / `sync` do Electron mantendo os mesmos nomes de pasta
* ~~Definir estratégia de projeção multi-janela~~ → **definida** em [multi-screen-web.md](../context/multi-screen-web.md)
