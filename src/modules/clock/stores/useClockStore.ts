import {
  closeAllPopups,
  exitPopupModule,
  isPopupModuleOpen,
  openPopupModule,
} from '@shared/services/popup-windows'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { loadClockConfig, saveClockConfig } from '../services/clock-preferences'
import { type ClockConfig, type ClockStyle, DEFAULT_CLOCK_CONFIG } from '../types/clock'

export const useClockStore = defineStore('clock', () => {
  const config = ref<ClockConfig>({ ...DEFAULT_CLOCK_CONFIG })
  const isProjecting = ref(false)
  const configOpen = ref(false)
  const hydrated = ref(false)

  let projectionWatchTimer: ReturnType<typeof setInterval> | null = null

  const isAnalog = computed(() => config.value.style === 'analog')

  function stopProjectionWatch() {
    if (!projectionWatchTimer) return
    clearInterval(projectionWatchTimer)
    projectionWatchTimer = null
  }

  function startProjectionWatch() {
    stopProjectionWatch()
    projectionWatchTimer = setInterval(() => {
      if (!isPopupModuleOpen('clock')) {
        isProjecting.value = false
        stopProjectionWatch()
      }
    }, 400)
  }

  function hydrate() {
    if (hydrated.value) return
    config.value = loadClockConfig()
    isProjecting.value = isPopupModuleOpen('clock')
    if (isProjecting.value) startProjectionWatch()
    hydrated.value = true
  }

  function persist() {
    saveClockConfig(config.value)
  }

  function setStyle(style: ClockStyle) {
    config.value = { ...config.value, style }
    persist()
  }

  function setShowSeconds(showSeconds: boolean) {
    config.value = { ...config.value, showSeconds }
    persist()
  }

  function setFormat24h(format24h: boolean) {
    config.value = { ...config.value, format24h }
    persist()
  }

  function setBgColor(bgColor: string) {
    config.value = { ...config.value, bgColor }
    persist()
  }

  function setTextColor(textColor: string) {
    config.value = { ...config.value, textColor }
    persist()
  }

  function resetToDefault() {
    config.value = { ...DEFAULT_CLOCK_CONFIG }
    persist()
  }

  function openConfig() {
    configOpen.value = true
  }

  function closeConfig() {
    configOpen.value = false
  }

  async function syncProjection() {
    const opened = await openPopupModule('clock')
    isProjecting.value = opened
    if (opened) startProjectionWatch()
    else stopProjectionWatch()
  }

  async function clearProjection() {
    await exitPopupModule()
    isProjecting.value = false
    stopProjectionWatch()
  }

  async function stopProjectionWindows() {
    await closeAllPopups()
    isProjecting.value = false
    stopProjectionWatch()
  }

  function refreshProjectionState() {
    const open = isPopupModuleOpen('clock')
    isProjecting.value = open
    if (open) startProjectionWatch()
    else stopProjectionWatch()
  }

  async function toggleProjection() {
    if (isProjecting.value && isPopupModuleOpen('clock')) {
      // Legado: exit limpa o conteúdo e mantém as janelas abertas
      await clearProjection()
      return
    }
    await syncProjection()
  }

  return {
    config,
    isProjecting,
    configOpen,
    hydrated,
    isAnalog,
    hydrate,
    setStyle,
    setShowSeconds,
    setFormat24h,
    setBgColor,
    setTextColor,
    resetToDefault,
    openConfig,
    closeConfig,
    toggleProjection,
    syncProjection,
    clearProjection,
    stopProjectionWindows,
    refreshProjectionState,
  }
})
