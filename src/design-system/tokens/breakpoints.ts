/**
 * Breakpoints — alinhados com Vuetify 4.1 (display thresholds).
 *
 * Todos os @media do projeto DEVEM usar estes valores.
 * Nunca inventar breakpoints ad-hoc (720, 767, 780, 800, 900, 1024, 1100...).
 */
export const breakpoints = {
  /** Mobile — abaixo de 600px */
  sm: 600,
  /** Tablet — abaixo de 960px */
  md: 960,
  /** Desktop — abaixo de 1280px */
  lg: 1280,
  /** Wide — abaixo de 1920px */
  xl: 1920,
} as const

export type BreakpointKey = keyof typeof breakpoints

/**
 * Helpers para @media queries em CSS/SCSS.
 * Uso: `@media (max-width: ${breakpointPx.sm}) { ... }`
 */
export const breakpointPx = {
  sm: `${breakpoints.sm}px`,
  md: `${breakpoints.md}px`,
  lg: `${breakpoints.lg}px`,
  xl: `${breakpoints.xl}px`,
} as const

export type BreakpointPx = keyof typeof breakpointPx
