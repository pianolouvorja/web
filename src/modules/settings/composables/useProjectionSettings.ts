import { hasLivePopups, syncPopupWindows } from '@shared/services/popup-windows'

import {
  getPopupCount,
  PROJECTION_DEFAULTS,
  setPopupCount,
} from '@shared/services/projection-preferences'
import { computed, ref } from 'vue'

const popupCount = ref(getPopupCount())

/** Espelha o legado: só estado local, sem persistência. */
const hardwareAccel = ref(true)
const fullscreenMode = ref(false)

const countMin = PROJECTION_DEFAULTS.popupCountMin
const countMax = PROJECTION_DEFAULTS.popupCountMax

/** Preferências da aba Projeção & Telas (legado web: popup_count + stubs locais). */
export function useProjectionSettings() {
  const sliderFill = computed(() => {
    const span = countMax - countMin
    const ratio = span <= 0 ? 0 : (popupCount.value - countMin) / span
    return `${Math.round(ratio * 100)}%`
  })

  function applyPopupCount(value: number) {
    popupCount.value = setPopupCount(value)
    if (hasLivePopups()) {
      syncPopupWindows()
    }
  }

  function decrementPopupCount() {
    applyPopupCount(popupCount.value - 1)
  }

  function incrementPopupCount() {
    applyPopupCount(popupCount.value + 1)
  }

  function onPopupCountInput(event: Event) {
    const target = event.target as HTMLInputElement
    applyPopupCount(Number(target.value))
  }

  return {
    popupCount,
    hardwareAccel,
    fullscreenMode,
    countMin,
    countMax,
    sliderFill,
    applyPopupCount,
    decrementPopupCount,
    incrementPopupCount,
    onPopupCountInput,
  }
}
