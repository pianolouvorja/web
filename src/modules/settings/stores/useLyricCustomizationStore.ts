import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  loadLyricCustomizationSettings,
  readImageAsDataUrl,
  saveLyricCustomizationSettings,
} from '../services/lyric-customization-preferences'
import {
  DEFAULT_LYRIC_CUSTOMIZATION,
  type LyricCustomizationSettings,
  type LyricFontWeight,
  type LyricVerticalAlign,
} from '../types/lyric-customization'

export const useLyricCustomizationStore = defineStore(
  'settings-lyric-customization',
  () => {
    const settings = ref<LyricCustomizationSettings>({
      ...DEFAULT_LYRIC_CUSTOMIZATION,
    })
    const hydrated = ref(false)
    const lastErrorKey = ref<string | null>(null)

    function persist(next: LyricCustomizationSettings) {
      settings.value = next
      saveLyricCustomizationSettings(next)
    }

    function patch(partial: Partial<LyricCustomizationSettings>) {
      persist({ ...settings.value, ...partial })
    }

    function hydrate() {
      if (hydrated.value) return
      settings.value = loadLyricCustomizationSettings()
      hydrated.value = true
    }

    function setLyricAlign(value: LyricVerticalAlign) {
      patch({ lyricAlign: value })
    }

    function setShowSongTitle(value: boolean) {
      patch({ showSongTitle: value })
    }

    function setCustomTextFormat(value: boolean) {
      patch({ customTextFormat: value })
    }

    function setCustomBackground(value: boolean) {
      patch({ customBackground: value })
    }

    function setFontSizePercent(value: number) {
      patch({ fontSizePercent: Math.min(200, Math.max(50, value)) })
    }

    function setFontColor(value: string) {
      patch({ fontColor: value })
    }

    function setFontWeight(value: LyricFontWeight) {
      patch({ fontWeight: value })
    }

    function setBackgroundColor(value: string) {
      patch({ backgroundColor: value })
    }

    function setBackgroundOpacity(value: number) {
      patch({ backgroundOpacity: Math.min(100, Math.max(0, value)) })
    }

    async function setBackgroundImageFromFile(file: File | null) {
      if (!file) {
        patch({ backgroundImage: null })
        return
      }

      try {
        const dataUrl = await readImageAsDataUrl(file)
        patch({ backgroundImage: dataUrl })
      } catch (error) {
        console.error('[lyric-customization] background image', error)
        lastErrorKey.value = 'settings.projection.errors.backgroundImage'
      }
    }

    function clearBackgroundImage() {
      patch({ backgroundImage: null })
    }

    function resetToDefaults() {
      persist({ ...DEFAULT_LYRIC_CUSTOMIZATION })
    }

    return {
      settings,
      hydrated,
      lastErrorKey,
      hydrate,
      setLyricAlign,
      setShowSongTitle,
      setCustomTextFormat,
      setCustomBackground,
      setFontSizePercent,
      setFontColor,
      setFontWeight,
      setBackgroundColor,
      setBackgroundOpacity,
      setBackgroundImageFromFile,
      clearBackgroundImage,
      resetToDefaults,
    }
  },
)
