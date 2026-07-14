<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { BROWSER_STORAGE_KEYS } from '@shared/constants/storage-keys'
import { getBrowserItem } from '@shared/services/browser-storage'
import {
  captureCurrentBounds,
  getPopupSlotId,
  parseSlotIndex,
  requestWindowManagementPermission,
  resolveBoundsForSlot,
  saveSlotBounds,
  scheduleRestoreOnWindow,
} from '@shared/services/popup-layout'
import {
  POPUP_STATE_CHANNEL,
  type PopupActionPayload,
  type PopupSyncPayload,
} from '@shared/services/popup-windows'

const route = useRoute()
const moduleId = ref('')
let layoutInterval: ReturnType<typeof setInterval> | null = null
let channel: BroadcastChannel | null = null

const slotIndex = computed(() => {
  const fromQuery = Number.parseInt(String(route.query.slot ?? ''), 10)
  if (!Number.isNaN(fromQuery) && fromQuery > 0) return fromQuery
  return parseSlotIndex(window.name)
})

const slotId = computed(() => {
  if (slotIndex.value) return getPopupSlotId(slotIndex.value)
  return window.name || ''
})

const moduleViews: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  bible: defineAsyncComponent(
    () => import('@modules/bible/views/BibleProjectionView.vue'),
  ),
  clock: defineAsyncComponent(
    () => import('@modules/clock/views/ClockProjectionView.vue'),
  ),
  timer: defineAsyncComponent(
    () => import('@modules/timer/views/TimerProjectionView.vue'),
  ),
  countdown: defineAsyncComponent(
    () => import('@modules/countdown/views/CountdownProjectionView.vue'),
  ),
  random: defineAsyncComponent(
    () => import('@modules/random/views/RandomProjectionView.vue'),
  ),
}

const activeView = computed(() => {
  if (!moduleId.value) return null
  return moduleViews[moduleId.value] ?? null
})

function applyModule(value: unknown) {
  moduleId.value = typeof value === 'string' ? value : ''
}

function refreshModule() {
  // Storage é a fonte de verdade (inclui limpar com ''). Query só no boot.
  const stored = getBrowserItem<string>(BROWSER_STORAGE_KEYS.popupModule, null)
  if (typeof stored === 'string') {
    applyModule(stored)
    return
  }

  const fromQuery = route.query.module
  if (typeof fromQuery === 'string' && fromQuery.length > 0) {
    applyModule(fromQuery)
    return
  }

  applyModule('')
}

async function restoreLayout() {
  const entry = resolveBoundsForSlot(slotId.value)
  if (!entry) return
  await requestWindowManagementPermission()
  scheduleRestoreOnWindow(window, entry)
}

function reportBounds() {
  if (!slotId.value) return

  const bounds = captureCurrentBounds(window)
  if (!bounds) return

  saveSlotBounds(slotId.value, bounds)

  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(
        { action: 'popup-bounds', slot: slotId.value, bounds },
        window.location.origin,
      )
    } catch (error) {
      console.log(error)
    }
  }
}

function handleMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin) return

  const data = event.data as
    | PopupSyncPayload
    | PopupActionPayload
    | { action: 'popup-bounds'; slot?: string; bounds?: unknown }
    | string
    | null

  if (!data || typeof data === 'string') return

  if ('action' in data && data.action === 'report-bounds') {
    reportBounds()
    return
  }

  if ('action' in data && data.action === 'restore-bounds') {
    void restoreLayout()
    return
  }

  if ('param' in data && data.param === 'popup_module') {
    applyModule(data.value)
  }
}

function onChannelMessage(event: MessageEvent<PopupSyncPayload>) {
  if (event.data?.param === 'popup_module') {
    applyModule(event.data.value)
  }
}

function onStorage(event: StorageEvent) {
  if (event.key && event.key !== BROWSER_STORAGE_KEYS.popupModule) return
  refreshModule()
}

onMounted(() => {
  refreshModule()

  window.addEventListener('message', handleMessage)
  window.addEventListener('resize', reportBounds)
  window.addEventListener('storage', onStorage)
  window.addEventListener('beforeunload', reportBounds)

  void restoreLayout()
  reportBounds()

  layoutInterval = setInterval(() => {
    reportBounds()
  }, 2000)

  try {
    channel = new BroadcastChannel(POPUP_STATE_CHANNEL)
    channel.addEventListener('message', onChannelMessage)
  } catch {
    channel = null
  }

  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage('mounted', window.location.origin)
    } catch {
      // ignore
    }
  }
})

onUnmounted(() => {
  reportBounds()
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('resize', reportBounds)
  window.removeEventListener('storage', onStorage)
  window.removeEventListener('beforeunload', reportBounds)

  if (layoutInterval) {
    clearInterval(layoutInterval)
    layoutInterval = null
  }

  channel?.removeEventListener('message', onChannelMessage)
  channel?.close()
  channel = null
})
</script>

<template>
  <div class="popup-host">
    <component
      :is="activeView"
      v-if="activeView"
    />
  </div>
</template>

<style scoped lang="scss">
.popup-host {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  color: #fff;
}
</style>
