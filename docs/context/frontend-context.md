# Contexto de Frontend — Web

Brief operacional para implementação de UI.  
Detalhes e tokens: `docs/prd/DESIGN_SYSTEM.md`.  
Artefatos visuais: `docs/stitch/`.  
Projeção / multi-telas: `docs/context/multi-screen-web.md`.

## Consulte sempre

- `docs/prd/FRONT_PRD.md`
- `docs/prd/DESIGN_SYSTEM.md`
- `docs/prd/MODULE_MAPPING.md`
- `docs/stitch/<tela>/` (quando existir referência da tela)
- Quando o stitch ainda não estiver em `StackVue/web`, consultar o equivalente em `StackVue/electron/docs/stitch/` (só visual — **não** `Legado/`)
- Multi-telas / projeção: **sempre** `docs/context/multi-screen-web.md` (não portar UI de monitores do Electron)

## Estilo

* Moderno
* Imersivo
* Glassmorphism
* Prioridade a telas largas (landscape); responsivo no browser quando fizer sentido

## Temas

* Ethereal Lumens (escuro — projeção / baixa luminosidade)
* Luminous Clarity (claro / suave)

## Elementos

* Footer estilo macOS Dock
* Gradientes radiais
* Cards translúcidos
* Blur configurável
* Tipografia Plus Jakarta Sans

## Regras

* Vuetify para componentes ricos
* Tailwind apenas para layout
* Seguir o Stitch como fonte visual (`docs/stitch/` + `docs/prd/`)
* UI sempre internacionalizada (Vue I18n)
* Shell (footer nav) em `src/layouts/` (compõe `@design-system`)
* Primitivas visuais (glass, dock, gradients, blur) em `src/design-system/`
* Telas em `src/modules/*/views/`
* Não reimplementar glass/dock/gradient dentro dos módulos
* Mesma linguagem visual e **mesmos nomes** de componentes do Electron — sem APIs de janela Electron
* Controles de projeção: `PopupScreenControls` / settings de popups — **não** `MultiScreenSelectCard` do Electron
