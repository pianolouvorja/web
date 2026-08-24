<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useLiturgyStore } from '@modules/liturgy/stores/useLiturgyStore'
import { useMediaPlayer } from '@modules/media/composables/useMediaPlayer'
import { WebRemoteBridge } from '../services/web-remote-bridge'

const { t } = useI18n()
const router = useRouter()
const liturgy = useLiturgyStore()
const player = useMediaPlayer()

const connected = ref(false)
const manualUrl = ref('')

let bridge: WebRemoteBridge | null = null
let unwatchState: (() => void) | null = null

function snapshot() {
  return {
    player: {
      playing: player.isPlaying.value,
      title: player.session.value?.title ?? null,
      positionMs: Math.round((player.currentTimeSec.value ?? 0) * 1000),
      durationMs: Math.round((player.durationSec.value ?? 0) * 1000),
      slideIndex: 0,
      slideCount: 0,
      volume: Math.round((player.volume.value ?? 0) * 100),
      canPrevious: (liturgy.selectedItemIndex ?? 0) > 0,
      canNext:
        (liturgy.selectedItemIndex ?? -1) + 1 < liturgy.currentItems.length,
    },
    liturgy: {
      selectedIndex: liturgy.selectedItemIndex,
      items: liturgy.currentItems.map((item, index) => ({
        index,
        type: item.type,
        title: item.name || item.subtitle || null,
        subtitle: item.subtitle || null,
        isCategory: item.type === 'category',
        accentColor: item.accentColor || null,
        done: item.done === true,
      })),
    },
  }
}

async function execute(command: {
  action: string
  value?: number
  positionMs?: number
}): Promise<boolean> {
  const items = liturgy.currentItems
  const index =
    typeof command.value === 'number'
      ? command.value
      : (liturgy.selectedItemIndex ?? -1)
  switch (command.action) {
    case 'liturgy.select':
      if (index < 0 || index >= items.length) return false
      await liturgy.playItemOnScreens(index)
      return true
    case 'liturgy.next':
      if (index + 1 >= items.length) return false
      await liturgy.selectItem(index + 1, router)
      return true
    case 'liturgy.previous':
      if (index <= 0) return false
      await liturgy.selectItem(index - 1, router)
      return true
    case 'liturgy.toggleDone':
      if (index < 0 || index >= items.length) return false
      liturgy.toggleItemDone(index)
      return true
    case 'player.play':
      await player.play()
      return true
    case 'player.pause':
      await player.pause()
      return true
    case 'player.stop':
      player.requestClose()
      return true
    case 'player.setVolume':
      if (typeof command.value !== 'number') return false
      player.setVolume(Math.min(100, Math.max(0, command.value)) / 100)
      return true
    case 'player.seek':
      if (typeof command.positionMs !== 'number') return false
      player.seekTo(command.positionMs / 1000)
      return true
    default:
      return false
  }
}

function disconnect() {
  unwatchState?.()
  unwatchState = null
  bridge?.stop()
  bridge = null
  connected.value = false
}

function connect(url: string) {
  disconnect()
  const full = url.startsWith('ws://') ? url : `ws://${url}`
  bridge = new WebRemoteBridge(full, {
    snapshot,
    execute,
    onClose: () => disconnect(),
  })
  unwatchState = watch(
    () => [
      liturgy.selectedItemIndex,
      JSON.stringify(
        liturgy.currentItems.map((item) => [item.name, item.subtitle, item.done]),
      ),
    ],
    () => bridge?.reportState(),
  )
  bridge.start()
  connected.value = true
}

onUnmounted(disconnect)
</script>

<template>
  <section class="remote-view">
    <h1 class="remote-view__title">
      {{ t('settings.remote.title') }}
    </h1>
    <p class="remote-view__hint">
      {{ t('settings.remote.hint') }}
    </p>

    <div v-if="!connected" class="remote-view__panel">
      <input
        v-model="manualUrl"
        type="text"
        class="remote-view__input"
        placeholder="192.168.1.15:39587?t=ABC123"
        aria-label="URL do Web Link"
        @keyup.enter="connect(manualUrl)"
      >
      <button
        type="button"
        class="remote-view__btn"
        @click="connect(manualUrl)"
      >
        {{ t('settings.remote.connect') }}
      </button>
    </div>

    <div v-else class="remote-view__panel">
      <p class="remote-view__status">
        {{ t('settings.remote.connected') }}
      </p>
      <button
        type="button"
        class="remote-view__btn remote-view__btn--ghost"
        @click="disconnect"
      >
        {{ t('settings.remote.disconnect') }}
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.remote-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 32rem;
}

.remote-view__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ds-color-on-surface);
}

.remote-view__hint {
  margin: 0;
  opacity: 0.75;
  line-height: 1.5;
}

.remote-view__panel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.remote-view__input {
  flex: 1;
  min-width: 14rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--ds-color-outline);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
}

.remote-view__btn {
  padding: 0.65rem 1.25rem;
  border: 0;
  border-radius: 10px;
  background: var(--ds-color-primary);
  color: var(--ds-color-on-primary, #fff);
  font-weight: 600;
  cursor: pointer;

  &--ghost {
    background: transparent;
    border: 1px solid var(--ds-color-outline);
    color: inherit;
  }
}

.remote-view__status {
  margin: 0;
  font-weight: 600;
  color: var(--ds-color-primary);
}
</style>
