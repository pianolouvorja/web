# PRD Front — LouvorJA - PIANO Web

> Origem: interface criada no Google Stitch (mesma linha visual do desktop).  
> Documento alinhado à stack web (`Vue 3 + Vite + TypeScript`, **sem Electron**).  
> Projeto base de código: `StackVue/electron` (Electron **novo** — não `Legado/`).  
> Documentos relacionados: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [MODULE_MAPPING.md](./MODULE_MAPPING.md) · [multi-screen-web.md](../context/multi-screen-web.md)

## 1. Visão geral do projeto

**LouvorJA - PIANO** na versão **web** é a aplicação no navegador para gerenciamento de culto. Oferece as mesmas ferramentas da linha desktop (biblioteca de músicas, leitura bíblica e utilitários), com foco em projeção visual e interface amigável — entregue como site/app web, não como instalador nativo.

## 2. Visão de design e identidade

A aplicação segue a mesma estética **moderna e imersiva** do Electron:

* **Linguagem visual:** glassmorphism, gradientes radiais suaves e tipografia limpa.
* **Temas:** Ethereal Lumens (escuro) e Luminous Clarity (claro/suave) — detalhes em [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
* **Navegação:** barra inferior inspirada em mobile (Footer Menu), maximizando o espaço vertical para o conteúdo.

## 3. Requisitos funcionais principais

### 3.1 Navegação principal

* **Barra de navegação inferior:** fixa na parte inferior da tela em todas as páginas.
  * **Itens:** Início (Home), Álbuns, Bíblia, Utilitários, Configurações.
  * **Interação:** efeito de magnificação no estilo macOS Dock ao passar o mouse (escala e elevação suaves).
* **Navegação superior (somente Configurações):** abas para subseções: Aparência, Geral, Mídia & Player, Projeção & Telas.

Mapeamento para módulos do código: [MODULE_MAPPING.md](./MODULE_MAPPING.md).

### 3.2 Telas e conteúdo

* **Tela inicial (Home):** logo da marca centralizado, barra de busca em destaque para descoberta de músicas e informação de versão no canto.
* **Configurações — Aparência:** alternância claro/escuro, sincronização automática de brilho (quando o browser permitir) e controles de intensidade do glassmorphism (ajuste de blur).
* **Configurações — Projeção & Telas:** configuração de **janelas popup** (quantidade de projeções, preferências de layout) via APIs do browser (`window.open`, Window Management quando disponível, Fullscreen API). **Não** usa seleção de monitores nativos do Electron.
* Preferências persistidas via storage web (`localStorage` / equivalente), não via main process.

Detalhe técnico canônico: [multi-screen-web.md](../context/multi-screen-web.md).

## 4. Ativos visuais

* **Logo oficial:** marca circular com clave de sol estilizada em fundo amarelo/azul.
* **Tipografia:** Plus Jakarta Sans (títulos, labels e corpo).
* **Ícones:** Tabler Icons (`ti-*`).

Detalhes de tokens e temas: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## 5. Especificações técnicas

* **Plataforma:** navegador (desktop landscape prioritário; responsivo conforme evolução).
* **Stack oficial:**
  * Vue 3 + TypeScript
  * Vite
  * Vuetify (componentes ricos)
  * Tailwind (apenas layout)
  * Pinia, Vue Router, Vue I18n
* **Fora de escopo:** Electron, main/preload/IPC, instaladores nativos, `Legado/` como fonte.
* **Interatividade:** transições suaves na troca de tema e nos estados de hover.
* **Projeção:** `PopupHost` + `popup-windows` (já implementados); módulos publicam conteúdo nas janelas `/popup`.

> Nota: a UI do Stitch é a referência visual; a implementação segue a stack acima. O código de partida é `StackVue/electron`, adaptado para web, **exceto** multi-telas (usar stack web).

## 6. Diretrizes de implementação (Front)

* Respeitar glassmorphism, gradientes e tipografia do design system.
* Navegação principal sempre via footer menu.
* Tailwind apenas para layout; Vuetify para componentes ricos.
* Temas claro/escuro e intensidade de blur devem ser configuráveis.
* Textos de UI via i18n; sem hardcode.
* Shell e navegação em `layouts/`; features em `modules/`.
* Manter **os mesmos nomes** e estrutura do Electron; adaptar só a camada de plataforma.
* Multi-telas: reutilizar implementação web — nunca portar `MultiScreen*` / monitores do Electron.
