/**
 * WT-5H: associação slot → monitor físico (Window Management API).
 *
 * Fonte única da verdade para ScreensCard e PopupRouteSelect: escolher um
 * monitor salva os bounds reais dele no layout do slot, e o
 * openPopupModule inteiro (mirror/rotas) nasce no monitor certo.
 */
import { getBrowserItem, setBrowserItem } from '@shared/services/browser-storage'
import {
  clearSlotBounds,
  getPopupSlotId,
  saveSlotBounds,
} from '@shared/services/popup-layout'
import type { WebScreen } from '@shared/services/display-service-web'

const KEY = 'louvorja-slot-monitors'
const OPERATOR_MONITOR_KEY = 'louvorja-operator-monitor'

export type SlotMonitorMap = Record<string, string> // slotId ('1','2'...) -> WebScreen.id

export function loadSlotAssignments(): SlotMonitorMap {
  const saved = getBrowserItem<SlotMonitorMap>(KEY)
  return saved && typeof saved === 'object' ? saved : {}
}

function persistSlotAssignments(map: SlotMonitorMap): void {
  setBrowserItem(KEY, map)
  // ScreensCard e PopupRouteSelect podem coexistir; sincroniza ambos sem store.
  window.dispatchEvent(new Event('louvorja-slot-monitors-changed'))
}

function buildMonitorBounds(screen: WebScreen) {
  return {
    left: screen.left,
    top: screen.top,
    width: screen.width,
    height: screen.height,
    screenLeft: screen.left,
    screenTop: screen.top,
    screenWidth: screen.width,
    screenHeight: screen.height,
  }
}

/** Atribui (ou move) um slot para o monitor. */
export function assignScreenToSlot(slotId: string, screen: WebScreen): void {
  saveSlotBounds(getPopupSlotId(Number(slotId)), buildMonitorBounds(screen))
  const map = loadSlotAssignments()
  map[slotId] = screen.id
  persistSlotAssignments(map)
}

/** Volta o slot para o automático (monitor atual no momento do open). */
export function clearScreenAssignment(slotId: string): void {
  clearSlotBounds(getPopupSlotId(Number(slotId)))
  const map = loadSlotAssignments()
  if (!(slotId in map)) return
  delete map[slotId]
  persistSlotAssignments(map)
}

/** Slot hoje atribuído ao monitor (ou null). */
export function findSlotForScreen(screenId: string): string | null {
  const map = loadSlotAssignments()
  const slotId = Object.keys(map).find((slot) => map[slot] === screenId)
  return slotId ?? null
}

/** Monitor onde fica a janela do operador; nunca recebe popup de projeção. */
export function getOperatorMonitor(): string | null {
  const saved = getBrowserItem<unknown>(OPERATOR_MONITOR_KEY)
  return typeof saved === 'string' && saved ? saved : null
}

export function setOperatorMonitor(screenId: string | null): void {
  if (screenId) setBrowserItem(OPERATOR_MONITOR_KEY, screenId)
  else setBrowserItem(OPERATOR_MONITOR_KEY, '')
  window.dispatchEvent(new Event('louvorja-slot-monitors-changed'))
}

/** Filtra slots cujo monitor físico é o PC do operador. */
export function excludeOperatorSlots(slots: number[]): number[] {
  const operator = getOperatorMonitor()
  if (!operator) return slots
  const assignments = loadSlotAssignments()
  return slots.filter((slot) => assignments[String(slot)] !== operator)
}

/**
 * Slot para receber o monitor escolhido no PopupRouteSelect: reusa o slot
 * já atribuído a ele; senão o primeiro slot livre; senão '1'.
 */
export function pickSlotForScreen(screenId: string, popupCount: number): string {
  const existing = findSlotForScreen(screenId)
  if (existing) return existing
  const map = loadSlotAssignments()
  for (let slot = 1; slot <= popupCount; slot += 1) {
    const slotId = String(slot)
    if (!(slotId in map)) return slotId
  }
  return '1'
}
