import { USER_PREFERENCE_KEYS } from '@shared/constants/storage-keys'
import { getUserPreference, setUserPreference } from '@shared/services/user-preferences'

import {
  DEFAULT_LYRIC_CUSTOMIZATION,
  type LyricCustomizationSettings,
  type LyricFontWeight,
  type LyricVerticalAlign,
} from '../types/lyric-customization'

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asAlign(value: unknown): LyricVerticalAlign {
  if (value === 'top' || value === 'center' || value === 'bottom') return value
  // Compatibilidade com legado (Cima/Centro/Baixo)
  if (value === 'Cima') return 'top'
  if (value === 'Centro') return 'center'
  if (value === 'Baixo') return 'bottom'
  return DEFAULT_LYRIC_CUSTOMIZATION.lyricAlign
}

function asFontWeight(value: unknown): LyricFontWeight {
  if (value === '400' || value === '600' || value === '700' || value === '900') {
    return value
  }
  return DEFAULT_LYRIC_CUSTOMIZATION.fontWeight
}

function pickLyricFields(source: Record<string, unknown>): LyricCustomizationSettings {
  return {
    lyricAlign: asAlign(source.lyricAlign),
    showSongTitle: asBoolean(source.showSongTitle, DEFAULT_LYRIC_CUSTOMIZATION.showSongTitle),
    customTextFormat: asBoolean(
      source.customTextFormat,
      DEFAULT_LYRIC_CUSTOMIZATION.customTextFormat,
    ),
    customBackground: asBoolean(
      source.customBackground,
      DEFAULT_LYRIC_CUSTOMIZATION.customBackground,
    ),
    fontSizePercent: Math.min(
      200,
      Math.max(50, asNumber(source.fontSizePercent, DEFAULT_LYRIC_CUSTOMIZATION.fontSizePercent)),
    ),
    fontColor: asString(source.fontColor, DEFAULT_LYRIC_CUSTOMIZATION.fontColor),
    fontWeight: asFontWeight(source.fontWeight),
    backgroundColor: asString(source.backgroundColor, DEFAULT_LYRIC_CUSTOMIZATION.backgroundColor),
    backgroundImage: typeof source.backgroundImage === 'string' ? source.backgroundImage : null,
    backgroundOpacity: Math.min(
      100,
      Math.max(
        0,
        asNumber(source.backgroundOpacity, DEFAULT_LYRIC_CUSTOMIZATION.backgroundOpacity),
      ),
    ),
  }
}

export function loadLyricCustomizationSettings(): LyricCustomizationSettings {
  const stored = getUserPreference<unknown>(USER_PREFERENCE_KEYS.projectionSettings, null)
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_LYRIC_CUSTOMIZATION }
  }
  return pickLyricFields(stored as Record<string, unknown>)
}

/**
 * Persiste os campos de letra em `projection.settings`, mesclando com
 * qualquer chave já existente (ex.: monitores do Electron).
 */
export function saveLyricCustomizationSettings(settings: LyricCustomizationSettings): void {
  const stored = getUserPreference<unknown>(USER_PREFERENCE_KEYS.projectionSettings, null)
  const base = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {}

  setUserPreference(USER_PREFERENCE_KEYS.projectionSettings, {
    ...base,
    ...settings,
  })
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('invalid image result'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}
