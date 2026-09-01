/**
 * Roteamento de popup por módulo — web sem desktop (WT-4a).
 *
 * Port do conceito de `palco-routing.ts` do desktop: cada módulo projetável
 * tem uma rota — 'mirror' (todas as popups seguem o módulo global) ou um
 * slotId específico ('1', '2'... = popup dedicada a esse módulo).
 * WT-5: rota 'tv' = SÓ a TV cloud (nenhum popup local abre) — paridade app:
 * destino independente por módulo. Persistência em localStorage. Conceito:
 * áudio fica na aba do operador; conteúdos podem divergir por tela.
 */

export type PopupRoute = 'mirror' | 'tv' | string // string = slotId (ex.: '1', '2')

export type PopupRoutableModule =
  | 'bible'
  | 'media'
  | 'liturgy-web'
  | 'random'
  | 'clock'
  | 'timer'
  | 'countdown'

const KEY = 'louvorja-popup-routing-v1'

export const POPUP_ROUTABLE_MODULES: PopupRoutableModule[] = [
  'bible',
  'media',
  'liturgy-web',
  'random',
  'clock',
  'timer',
  'countdown',
]

type RouteMap = Record<PopupRoutableModule, PopupRoute>

let routes: RouteMap = Object.fromEntries(
  POPUP_ROUTABLE_MODULES.map((module) => [module, 'mirror']),
) as RouteMap

try {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    routes = { ...routes, ...(JSON.parse(raw) as Partial<RouteMap>) }
  }
} catch {
  // defaults
}

export function getPopupRoute(module: PopupRoutableModule): PopupRoute {
  return routes[module] ?? 'mirror'
}

export function setPopupRoute(module: PopupRoutableModule, route: PopupRoute): void {
  routes[module] = route
  try {
    localStorage.setItem(KEY, JSON.stringify(routes))
  } catch {
    // ignore
  }
}

export function getPopupRoutes(): Readonly<RouteMap> {
  return { ...routes }
}

export function isMirrorRoute(module: PopupRoutableModule): boolean {
  return getPopupRoute(module) === 'mirror'
}

/**
 * Resolve em quais slots um módulo projeta:
 * - mirror → todos os slots ativos (undefined = quem chama decide)
 * - rota individual → [slotId]
 */
export function resolveSlotsForModule(
  module: PopupRoutableModule,
  availableSlots: number[],
): number[] | undefined {
  const route = getPopupRoute(module)
  if (route === 'mirror') return undefined
  const slot = Number.parseInt(route, 10)
  if (Number.isNaN(slot) || !availableSlots.includes(slot)) {
    return availableSlots.length > 0 ? [availableSlots[0]] : undefined
  }
  return [slot]
}
