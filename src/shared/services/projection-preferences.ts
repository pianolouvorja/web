import { USER_PREFERENCE_KEYS } from '@shared/constants/storage-keys'
import {
  getUserPreference,
  setUserPreference,
} from '@shared/services/user-preferences'

const POPUP_COUNT_MIN = 1
const POPUP_COUNT_MAX = 6
const POPUP_COUNT_DEFAULT = 2

function clampPopupCount(value: unknown): number {
  const count = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
  if (Number.isNaN(count)) return POPUP_COUNT_DEFAULT
  return Math.min(POPUP_COUNT_MAX, Math.max(POPUP_COUNT_MIN, count))
}

function getBooleanPreference(key: string, fallback: boolean): boolean {
  const stored = getUserPreference<unknown>(key)
  return typeof stored === 'boolean' ? stored : fallback
}

function availableSlots(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1)
}

function asSlotArray(raw: unknown, maxCount: number): number[] | null {
  if (!Array.isArray(raw)) return null
  const slots = raw
    .map((entry) => Number(entry)) // NOSONAR
    .filter((slot) => Number.isInteger(slot) && slot >= 1 && slot <= maxCount)
  return [...new Set(slots)].sort((a, b) => a - b)
}

/** Quantidade de telas de projeção disponíveis (1–6). */
export function getPopupCount(): number {
  return clampPopupCount(getUserPreference(USER_PREFERENCE_KEYS.popupCount))
}

/**
 * Define a quantidade de telas disponíveis e reconcilia a seleção alvo.
 * Telas novas entram selecionadas; slots inválidos saem.
 */
export function setPopupCount(count: number): number {
  const previous = getPopupCount()
  const next = clampPopupCount(count)
  setUserPreference(USER_PREFERENCE_KEYS.popupCount, next)

  const previousTargets = getTargetPopupSlots()
  const nextTargets = reconcileTargetPopupSlots(previousTargets, previous, next)
  setUserPreference(USER_PREFERENCE_KEYS.targetPopupSlots, nextTargets)

  return next
}

/**
 * Slots selecionados para receber projeção (subset de 1..getPopupCount()).
 * Default: todas as telas disponíveis.
 */
export function getTargetPopupSlots(): number[] {
  const count = getPopupCount()
  const allowed = availableSlots(count)
  const stored = asSlotArray(
    getUserPreference<unknown>(USER_PREFERENCE_KEYS.targetPopupSlots, null),
    count,
  )

  if (stored == null) {
    return allowed
  }

  const filtered = stored.filter((slot) => allowed.includes(slot))
  return filtered
}

export function setTargetPopupSlots(slots: number[]): number[] {
  const count = getPopupCount()
  const allowed = new Set(availableSlots(count))
  const next = [...new Set(slots.map(Number))]
    .filter((slot) => allowed.has(slot))
    .sort((a, b) => a - b)

  setUserPreference(USER_PREFERENCE_KEYS.targetPopupSlots, next)
  return next
}

/** Próximas popups tentam fullscreen ainda no gesto original de projetar. */
export function getProjectionFullscreenMode(): boolean {
  return getBooleanPreference(USER_PREFERENCE_KEYS.projectionFullscreenMode, true)
}

export function setProjectionFullscreenMode(enabled: boolean): void {
  setUserPreference(USER_PREFERENCE_KEYS.projectionFullscreenMode, enabled)
}

export function toggleTargetPopupSlot(slot: number): number[] {
  const current = getTargetPopupSlots()
  const id = Number(slot)
  if (!Number.isInteger(id) || id < 1 || id > getPopupCount()) {
    return current
  }

  if (current.includes(id)) {
    return setTargetPopupSlots(current.filter((entry) => entry !== id))
  }

  return setTargetPopupSlots([...current, id])
}

/**
 * Reconcilia seleção quando o número de telas disponíveis muda.
 * - Remove slots acima do novo limite
 * - Slots novos entram selecionados
 */
export function reconcileTargetPopupSlots(
  current: number[],
  previousCount: number,
  nextCount: number,
): number[] {
  const allowed = availableSlots(nextCount)
  const kept = current.filter((slot) => allowed.includes(slot))

  if (nextCount > previousCount) {
    for (let slot = previousCount + 1; slot <= nextCount; slot++) {
      if (!kept.includes(slot)) kept.push(slot)
    }
  }

  return [...new Set(kept)].sort((a, b) => a - b)
}

export function getMediaUseInternalPlayer(): boolean {
  return getBooleanPreference(USER_PREFERENCE_KEYS.mediaUseInternalPlayer, true)
}

export function setMediaUseInternalPlayer(enabled: boolean): void {
  setUserPreference(USER_PREFERENCE_KEYS.mediaUseInternalPlayer, enabled)
}

export function getMediaAutoProjectVideo(): boolean {
  return getBooleanPreference(USER_PREFERENCE_KEYS.mediaAutoProjectVideo, true)
}

export function setMediaAutoProjectVideo(enabled: boolean): void {
  setUserPreference(USER_PREFERENCE_KEYS.mediaAutoProjectVideo, enabled)
}

export function getMediaPauseOnMinimize(): boolean {
  return getBooleanPreference(USER_PREFERENCE_KEYS.mediaPauseOnMinimize, false)
}

export function setMediaPauseOnMinimize(enabled: boolean): void {
  setUserPreference(USER_PREFERENCE_KEYS.mediaPauseOnMinimize, enabled)
}

export function getMediaLazyLoad(): boolean {
  return getBooleanPreference(USER_PREFERENCE_KEYS.mediaLazyLoad, true)
}

export function setMediaLazyLoad(enabled: boolean): void {
  setUserPreference(USER_PREFERENCE_KEYS.mediaLazyLoad, enabled)
}

export function getMediaFadeAudio(): boolean {
  return getBooleanPreference(USER_PREFERENCE_KEYS.mediaFadeAudio, true)
}

export function setMediaFadeAudio(enabled: boolean): void {
  setUserPreference(USER_PREFERENCE_KEYS.mediaFadeAudio, enabled)
}

export const PROJECTION_DEFAULTS = {
  popupCount: POPUP_COUNT_DEFAULT,
  popupCountMin: POPUP_COUNT_MIN,
  popupCountMax: POPUP_COUNT_MAX,
} as const
