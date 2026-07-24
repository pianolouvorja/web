# Responsividade mobile — WEB

## Acordo

Trabalho de layout mobile (**viewport mínimo 375px**) ocorre **somente** neste repo. O APP Electron mantém resolução mínima de desktop.

## Problemas cobertos (SPEC-01)

1. Logo quebrando no header
2. Bíblia não responsiva
3. Controles de projeção/telas sem sentido no celular
4. Ícone multi-telas nos players
5. Multi-tela / player de projeção na Bíblia no mobile

## Abordagem técnica

- Composable `useIsMobile()` com `window.matchMedia`
- Breakpoints alinhados à SPEC (ex.: 375 / 600 / 768)
- `v-if="!isMobile"` nos controles de projeção
- `clamp()` / layout coluna única onde necessário

## Referências

- Spec: `docs/planning/specs/SPEC-01-Mobile-Responsive.md`
- Design system: `docs/prd/DESIGN_SYSTEM.md`
- Multi-tela browser: `docs/context/multi-screen-web.md`
