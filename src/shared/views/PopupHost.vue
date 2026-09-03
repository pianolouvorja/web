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

/** Overlay de ativação visível enquanto o fullscreen não foi obtido. */
const fullscreenPending = ref(false)

/** Sai do overlay quando o documento entra em fullscreen por qualquer via. */
function onFullscreenChange(): void {
  if (document.fullscreenElement) fullscreenPending.value = false
}

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
  document.addEventListener('fullscreenchange', onFullscreenChange)

  void restoreLayout()
  reportBounds()

  // WT-5F: fullscreen REAL no Chrome. O feature `fullscreen=yes` do
  // window.open é IGNORADO por navegadores (só o Electron respeita) —
  // barra de endereço + título continuavam. A Fullscreen API esconde
  // tudo; a popup herda a user activation do clique do operador que a
  // abriu, então requestFullscreen é permitido. Fallback: maximiza via
  // resizeTo/moveTo (cobre a área útil, sem chrome removido).
  if (!isControlPopup.value) {
    const el = document.documentElement
    const req = el.requestFullscreen?.bind(el)
    if (req) {
      req().catch(() => {
        // Sem activation (ex.: reload da popup): aproxima de tela cheia.
        try {
          const scr = window.screen as Screen & { availLeft?: number; availTop?: number }
          window.moveTo(scr.availLeft ?? 0, scr.availTop ?? 0)
          window.resizeTo(window.screen.availWidth, window.screen.availHeight)
        } catch {
          // ignore — ambiente sem controle de janela
        }
      })
    }
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

  // WT-5F: garantir tela cheia. O Chrome não transfere a user activation
  // do clique que abriu a popup, então requestFullscreen no boot costuma
  // dar NotAllowedError. Tentamos mesmo assim; se bloquear, armamos um
  // overlay "clique para tela cheia" que consome o PRIMEIRO gesto dentro
  // da popup (click ou qualquer tecla) e entra em fullscreen.
  if (!isControlPopup.value) {
    enterFullscreenOrArm().catch(() => {})
  }
})

/**
 * Tenta fullscreen; se o browser negar, arma overlay de ativação.
 * Resolve quando o documento entra em fullscreen.
 */
async function enterFullscreenOrArm(): Promise<void> {
  const el = document.documentElement
  try {
    await el.requestFullscreen()
    return
  } catch {
    // Sem activation — seguir com overlay.
  }

  fullscreenPending.value = true

  const activate = (): void => {
    if (document.fullscreenElement) return
    void el
      .requestFullscreen()
      .catch(() => {
        // Tentativa de novo no próximo gesto — o listener permanece.
      })
      .finally(() => {
        if (document.fullscreenElement) {
          fullscreenPending.value = false
          window.removeEventListener('click', activate)
          window.removeEventListener('keydown', activate)
        }
      })
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
  document.removeEventListener('fullscreenchange', onFullscreenChange)

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

    <!-- WT-5F: overlay de ativação — some no 1º gesto (vira fullscreen). -->
    <div
      v-if="fullscreenPending"
      class="popup-host__fullscreen-hint"
    >
      <i
        class="ti ti-maximize"
        aria-hidden="true"
      />
      <span>Clique para tela cheia</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.popup-host {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  color: #fff;
  position: relative;
}

.popup-host--control {
  background: #0c0c0e;
}

.popup-host__fullscreen-hint {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgb(0 0 0 / 78%);
  color: rgb(255 255 255 / 92%);
  font-family: inherit;
  font-size: clamp(18px, 2.4vmin, 34px);
  font-weight: 600;
  cursor: pointer;
  user-select: none;

  .ti {
    font-size: clamp(32px, 5vmin, 72px);
  }
}
</style>
