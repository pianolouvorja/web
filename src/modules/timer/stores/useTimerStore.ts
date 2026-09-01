import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  exitPopupModule,
  isPopupModuleOpen,
  openPopupModule,
} from '@shared/services/popup-windows'

import { computeElapsedMs, formatElapsedMs } from '../services/timer-format'
import { publishToStageRelay } from '@shared/services/palco-cloud-bridge'
import {
  loadTimerDisplayConfig,
  saveTimerDisplayConfig,
} from '../services/timer-preferences'
import {
  publishTimerRuntime,
  readTimerRuntimeFromStorage,
} from '../services/timer-runtime'
import {
  DEFAULT_TIMER_DISPLAY_CONFIG,
  DEFAULT_TIMER_RUNTIME,
  type TimerDisplayConfig,
  type TimerRuntimeState,
  type TimerTimeFormat,
} from '../types/timer'

export const useTimerStore = defineStore('timer', () => {
  const config = ref<TimerDisplayConfig>({ ...DEFAULT_TIMER_DISPLAY_CONFIG })
  const runtime = ref<TimerRuntimeState>({
    ...DEFAULT_TIMER_RUNTIME,
    savedTimesMs: [],
  })
  const isProjecting = ref(false)
  const configOpen = ref(false)
  const hydrated = ref(false)

  let projectionWatchTimer: ReturnType<typeof setInterval> | null = null

  const isRunning = computed(() => runtime.value.status === 'running')
  const isPaused = computed(() => runtime.value.status === 'paused')

  function stopProjectionWatch() {
    if (!projectionWatchTimer) return
    clearInterval(projectionWatchTimer)
    projectionWatchTimer = null
  }

  function startProjectionWatch() {
    stopProjectionWatch()
    projectionWatchTimer = setInterval(() => {
      if (!isPopupModuleOpen('timer')) {
        isProjecting.value = false
        stopProjectionWatch()
      }
    }, 400)
  }

  function syncRuntime() {
    publishTimerRuntime(runtime.value)
    // WT-5: display formatado vai pro relay (best-effort, no-op sem sessão).
    const display = formatElapsedMs(
      computeElapsedMs(runtime.value.accumulatedMs, runtime.value.segmentStartedAt, runtime.value.status, Date.now()),
      config.value.timeFormat,
    )
    publishToStageRelay('timer', { display })
  }

  function hydrate() {
    if (hydrated.value) return
    config.value = loadTimerDisplayConfig()
    runtime.value = readTimerRuntimeFromStorage()
    isProjecting.value = isPopupModuleOpen('timer')
    if (isProjecting.value) startProjectionWatch()
    hydrated.value = true
  }

  function persistConfig() {
    saveTimerDisplayConfig(config.value)
  }

  function setTimeFormat(timeFormat: TimerTimeFormat) {
    config.value = { ...config.value, timeFormat }
    persistConfig()
  }

  function setBgColor(bgColor: string) {
    config.value = { ...config.value, bgColor }
    persistConfig()
  }

  function setTextColor(textColor: string) {
    config.value = { ...config.value, textColor }
    persistConfig()
  }

  function resetDisplayToDefault() {
    config.value = { ...DEFAULT_TIMER_DISPLAY_CONFIG }
    persistConfig()
  }

  function openConfig() {
    configOpen.value = true
  }

  function closeConfig() {
    configOpen.value = false
  }

  function start() {
    if (runtime.value.status === 'running') return

    runtime.value = {
      ...runtime.value,
      status: 'running',
      segmentStartedAt: Date.now(),
    }
    syncRuntime()
  }

  function pause() {
    if (runtime.value.status !== 'running' || runtime.value.segmentStartedAt == null) {
      return
    }

    const elapsed = computeElapsedMs(
      runtime.value.accumulatedMs,
      runtime.value.segmentStartedAt,
      'running',
      Date.now(),
    )

    runtime.value = {
      ...runtime.value,
      status: 'paused',
      segmentStartedAt: null,
      accumulatedMs: elapsed,
    }
    syncRuntime()
  }

  function reset() {
    const keepRunning = runtime.value.status === 'running'

    runtime.value = {
      ...runtime.value,
      status: keepRunning ? 'running' : 'idle',
      segmentStartedAt: keepRunning ? Date.now() : null,
      accumulatedMs: 0,
    }
    syncRuntime()
  }

  function saveMark() {
    const elapsed = computeElapsedMs(
      runtime.value.accumulatedMs,
      runtime.value.segmentStartedAt,
      runtime.value.status,
      Date.now(),
    )

    runtime.value = {
      ...runtime.value,
      savedTimesMs: [...runtime.value.savedTimesMs, elapsed],
    }
    syncRuntime()
  }

  function removeSavedMark(index: number) {
    runtime.value = {
      ...runtime.value,
      savedTimesMs: runtime.value.savedTimesMs.filter((_, i) => i !== index),
    }
    syncRuntime()
  }

  function clearSavedMarks() {
    runtime.value = {
      ...runtime.value,
      savedTimesMs: [],
    }
    syncRuntime()
  }

  async function syncProjection() {
    syncRuntime()
    const opened = await openPopupModule('timer')
    isProjecting.value = opened
    if (opened) startProjectionWatch()
    else stopProjectionWatch()
  }

  async function clearProjection() {
    await exitPopupModule()
    isProjecting.value = false
    stopProjectionWatch()
    // WT-5: TV é destino independente — parar manda idle pro relay
    runtime.value = { ...DEFAULT_TIMER_RUNTIME, savedTimesMs: runtime.value.savedTimesMs }
    syncRuntime()
  }

  function refreshProjectionState() {
    const open = isPopupModuleOpen('timer')
    isProjecting.value = open
    if (open) startProjectionWatch()
    else stopProjectionWatch()
  }

  async function toggleProjection() {
    if (isProjecting.value && isPopupModuleOpen('timer')) {
      await clearProjection()
      return
    }
    await syncProjection()
  }

  return {
    config,
    runtime,
    isProjecting,
    configOpen,
    hydrated,
    isRunning,
    isPaused,
    hydrate,
    setTimeFormat,
    setBgColor,
    setTextColor,
    resetDisplayToDefault,
    openConfig,
    closeConfig,
    start,
    pause,
    reset,
    saveMark,
    removeSavedMark,
    clearSavedMarks,
    toggleProjection,
    syncProjection,
    clearProjection,
    refreshProjectionState,
  }
})
