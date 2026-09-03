<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { BROWSER_STORAGE_KEYS } from '@shared/constants/storage-keys'
import { getBrowserItem } from '@shared/services/browser-storage'
import {
  captureCurrentBounds,
  getPopupSlotId,
  LITURGY_CONTROL_LAYOUT_ID,
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

const popupRole = computed(() => {
  const role = String(route.query.role ?? '')
  if (role === 'control' || role === 'screen') return role
  if (window.name === 'LiturgyWebControl') return 'control'
  return 'screen'
})

const isControlPopup = computed(() => popupRole.value === 'control')

const slotIndex = computed(() => {
  if (isControlPopup.value) return 0
  const fromQuery = Number.parseInt(String(route.query.slot ?? ''), 10)
  if (!Number.isNaN(fromQuery) && fromQuery > 0) return fromQuery
  return parseSlotIndex(window.name)
})

const slotId = computed(() => {
  if (isControlPopup.value) return LITURGY_CONTROL_LAYOUT_ID
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
  media: defineAsyncComponent(
    () => import('@modules/media/views/MediaProjectionView.vue'),
  ),
  random: defineAsyncComponent(
    () => import('@modules/random/views/RandomProjectionView.vue'),
  ),
  'liturgy-web': defineAsyncComponent(
    () => import('@modules/liturgy/views/LiturgyWebProjectionView.vue'),
  ),
}

const activeView = computed(() => {
  if (!moduleId.value) return null
  return moduleViews[moduleId.value] ?? null
})

function applyModule(value: unknown) {
  moduleId.value = typeof value === 'string' ? value : ''
}

/**
 * Módulo desta popup. Se a URL trouxe ?module=, a popup é DEDICADA — não
 * segue o módulo global (roteamento por tela: hinos numa, bíblia noutra).
 * Sem query, comporta-se como popup espelho (segue o storage global).
 */
const dedicatedModule = (() => {
  const fromQuery = route.query.module
  return typeof fromQuery === 'string' && fromQuery.length > 0 ? fromQuery : null
})()

function refreshModule() {
  // Popup dedicada (?module= na URL): módulo é imutável.
  if (dedicatedModule) {
    applyModule(dedicatedModule)
    return
  }

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
  // WT-5F: telas de projeção NÃO se restauram — abrem fullscreen via
  // getOpenFeatures e qualquer restore aqui encolheria de volta pra janela
  // normal. Restore só para a janela de controle da liturgia.
  if (!isControlPopup.value) return
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

function closeThisScreenIfNeeded() {
  if (isControlPopup.value) return
  try {
    reportBounds()
  } catch {
    // ignore
  }
  window.close()
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

  if ('action' in data && data.action === 'close-screens') {
    closeThisScreenIfNeeded()
    return
  }

  if ('action' in data && data.action === 'report-bounds') {
    reportBounds()
    return
  }

  if ('action' in data && data.action === 'restore-bounds') {
    void restoreLayout()
    return
  }

  if ('param' in data && data.param === 'popup_module' && !dedicatedModule) {
    applyModule(data.value)
  }
}

function onChannelMessage(
  event: MessageEvent<PopupSyncPayload | PopupActionPayload>,
) {
  const data = event.data
  if (!data || typeof data !== 'object') return

  if ('action' in data && data.action === 'close-screens') {
    closeThisScreenIfNeeded()
    return
  }
  if ('param' in data && data.param === 'popup_module' && !dedicatedModule) {
    applyModule(data.value)
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

  // WT-5F: fullscreen automático SEM overlay quando possível. Se o browser
  // negar (popup sem activation própria), NÃO mostramos o overlay — o
  // conteúdo já abre cobrindo a área útil e o fullscreen entra no 1º gesto
  // sem precisar de overlay visível.
  if (!isControlPopup.value) {
    const el = document.documentElement
    el.requestFullscreen?.().catch(() => {
      // Sem activation — sem overlay; 1º clique/tecla na janela entra em
      // fullscreen silenciosamente.
      armSilentFullscreen(el)
    })
  }

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

/**
 * Tenta fullscreen; se o browser negar, arma captura de gesto silenciosa.
 * SEM overlay: o primeiro clique/tecla na janela ativa o fullscreen.
 */
function armSilentFullscreen(el: HTMLElement): void {
  const activate = (): void => {
    if (document.fullscreenElement) {
      cleanup()
      return
    }
    void el.requestFullscreen().finally(() => cleanup())
  }
  const cleanup = (): void => {
    window.removeEventListener('click', activate)
    window.removeEventListener('keydown', activate)
  }
  window.addEventListener('click', activate)
  window.addEventListener('keydown', activate)
}

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
  <div
    class="popup-host"
    :class="{ 'popup-host--control': isControlPopup }"
  >
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

.popup-host--control {
  background: #0c0c0e;
}
</style>
