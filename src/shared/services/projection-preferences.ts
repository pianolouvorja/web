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

/** Quantidade de telas de projeção (1–6). */
export function getPopupCount(): number {
  return clampPopupCount(getUserPreference(USER_PREFERENCE_KEYS.popupCount))
}

export function setPopupCount(count: number): number {
  const next = clampPopupCount(count)
  setUserPreference(USER_PREFERENCE_KEYS.popupCount, next)
  return next
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
