import { storeToRefs } from 'pinia'

import { useLyricCustomizationStore } from '../stores/useLyricCustomizationStore'

/** Fachada da Personalização da Letra para views/componentes. */
export function useLyricCustomization() {
  const store = useLyricCustomizationStore()
  const { settings, lastErrorKey } = storeToRefs(store)

  return {
    settings,
    lastErrorKey,
    hydrate: store.hydrate,
    setLyricAlign: store.setLyricAlign,
    setShowSongTitle: store.setShowSongTitle,
    setCustomTextFormat: store.setCustomTextFormat,
    setCustomBackground: store.setCustomBackground,
    setFontSizePercent: store.setFontSizePercent,
    setFontColor: store.setFontColor,
    setFontWeight: store.setFontWeight,
    setBackgroundColor: store.setBackgroundColor,
    setBackgroundOpacity: store.setBackgroundOpacity,
    setBackgroundImageFromFile: store.setBackgroundImageFromFile,
    clearBackgroundImage: store.clearBackgroundImage,
    resetToDefaults: store.resetToDefaults,
  }
}
