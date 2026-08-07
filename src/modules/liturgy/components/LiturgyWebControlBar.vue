<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import {
  getPopupCount,
  getTargetPopupSlots,
  toggleTargetPopupSlot,
} from '@shared/services/projection-preferences'

const props = defineProps<{
  showTransport: boolean
  showSiteNav?: boolean
  canGoBack?: boolean
  canGoForward?: boolean
  isPlaying: boolean
  muted: boolean
  volume: number
  currentTime: number
  duration: number
  projecting: boolean
  mirrorHint?: boolean
}>()

const emit = defineEmits<{
  togglePlay: []
  toggleMute: []
  'update:volume': [value: number]
  seek: [seconds: number]
  seekPreview: [ratio: number]
  seekStart: []
  seekEnd: []
  toggleProject: []
  screensChanged: [slots: number[]]
  siteBack: []
  siteForward: []
  siteReload: []
  startMirror: []
}>()

const panelOpen = ref(false)
const availableCount = ref(getPopupCount())
const selectedSlots = ref<number[]>(getTargetPopupSlots())

const screenCount = computed(() => selectedSlots.value.length)

const seekRatio = computed(() => {
  if (props.duration <= 0) return 0
  return Math.min(1, Math.max(0, props.currentTime / props.duration))
})

const timeLabel = computed(
  () => `${formatTime(props.currentTime)} / ${formatTime(props.duration)}`,
)

const projectTitle = computed(() =>
  props.projecting ? 'Retirar projeção' : 'Projetar nas telas',
)

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function refreshScreens() {
  availableCount.value = getPopupCount()
  selectedSlots.value = getTargetPopupSlots()
}

function togglePanel() {
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) refreshScreens()
}

function onToggleSlot(slot: number) {
  selectedSlots.value = toggleTargetPopupSlot(slot)
  emit('screensChanged', selectedSlots.value)
}

function onVolumeInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:volume', Number(target.value) / 100)
}

function onSeekInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('seekPreview', Number(target.value) / 1000)
}

function onSeekPointerDown() {
  emit('seekStart')
}

function onSeekPointerUp(event: Event) {
  const target = event.target as HTMLInputElement
  const ratio = Number(target.value) / 1000
  emit('seek', ratio * (props.duration || 0))
  emit('seekEnd')
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  const root = document.querySelector('.liturgy-web-control-bar')
  if (root?.contains(target)) return
  panelOpen.value = false
}

onMounted(() => {
  refreshScreens()
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('storage', refreshScreens)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('storage', refreshScreens)
})
</script>

<template>
  <div
    class="liturgy-web-control-bar"
    :class="{ 'is-panel-open': panelOpen }"
  >
    <div
      v-if="panelOpen"
      class="liturgy-web-control-bar__panel"
      role="dialog"
      aria-label="Selecionar telas"
      @click.stop
    >
      <p class="liturgy-web-control-bar__panel-title">
        Selecionar telas
      </p>
      <p class="liturgy-web-control-bar__panel-hint">
        Marque os monitores onde o conteúdo deve ser projetado.
      </p>
      <ul
        v-if="availableCount > 0"
        class="liturgy-web-control-bar__panel-list"
      >
        <li
          v-for="slot in availableCount"
          :key="slot"
        >
          <label
            class="liturgy-web-control-bar__option"
            :class="{ 'is-active': selectedSlots.includes(slot) }"
          >
            <input
              type="checkbox"
              :checked="selectedSlots.includes(slot)"
              @change="onToggleSlot(slot)"
            >
            <span>Tela {{ slot }}</span>
          </label>
        </li>
      </ul>
      <p
        v-else
        class="liturgy-web-control-bar__panel-hint"
      >
        Nenhuma tela configurada.
      </p>
    </div>

    <div
      class="liturgy-web-control-bar__bar"
      :class="{
        'has-transport': showTransport,
        'has-site-nav': showSiteNav,
      }"
    >
      <div class="liturgy-web-control-bar__transport">
        <template v-if="showSiteNav">
          <button
            type="button"
            class="liturgy-web-control-bar__btn"
            title="Voltar"
            aria-label="Voltar"
            :disabled="!canGoBack"
            @click="emit('siteBack')"
          >
            <i
              class="ti ti-arrow-left"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            class="liturgy-web-control-bar__btn"
            title="Avançar"
            aria-label="Avançar"
            :disabled="!canGoForward"
            @click="emit('siteForward')"
          >
            <i
              class="ti ti-arrow-right"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            class="liturgy-web-control-bar__btn"
            title="Recarregar"
            aria-label="Recarregar"
            @click="emit('siteReload')"
          >
            <i
              class="ti ti-refresh"
              aria-hidden="true"
            />
          </button>
          <span class="liturgy-web-control-bar__label">Controle do site</span>
        </template>
        <template v-else-if="showTransport">
          <button
            type="button"
            class="liturgy-web-control-bar__btn"
            :title="isPlaying ? 'Pausar' : 'Reproduzir'"
            :aria-label="isPlaying ? 'Pausar' : 'Reproduzir'"
            @click="emit('togglePlay')"
          >
            <i
              class="ti"
              :class="isPlaying ? 'ti-player-pause' : 'ti-player-play'"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            class="liturgy-web-control-bar__btn"
            :title="muted ? 'Ativar som' : 'Silenciar'"
            :aria-label="muted ? 'Ativar som' : 'Silenciar'"
            @click="emit('toggleMute')"
          >
            <i
              class="ti"
              :class="muted || volume <= 0 ? 'ti-volume-off' : 'ti-volume'"
              aria-hidden="true"
            />
          </button>

          <input
            class="liturgy-web-control-bar__volume"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round((muted ? 0 : volume) * 100)"
            aria-label="Volume"
            @input="onVolumeInput"
          >
        </template>
      </div>

      <input
        v-if="showTransport"
        class="liturgy-web-control-bar__seek"
        type="range"
        min="0"
        max="1000"
        step="1"
        :value="Math.round(seekRatio * 1000)"
        aria-label="Posição"
        @pointerdown="onSeekPointerDown"
        @pointerup="onSeekPointerUp"
        @input="onSeekInput"
      >

      <div class="liturgy-web-control-bar__meta">
        <button
          v-if="mirrorHint"
          type="button"
          class="liturgy-web-control-bar__btn liturgy-web-control-bar__btn--mirror"
          title="Espelhar navegação e scroll nas telas"
          aria-label="Espelhar navegação e scroll nas telas"
          @click="emit('startMirror')"
        >
          <i
            class="ti ti-cast"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="liturgy-web-control-bar__btn"
          :class="{ 'is-active': projecting }"
          :title="projectTitle"
          :aria-label="projectTitle"
          :aria-pressed="projecting ? 'true' : 'false'"
          @click="emit('toggleProject')"
        >
          <i
            class="ti"
            :class="projecting ? 'ti-player-stop' : 'ti-arrow-up-right'"
            aria-hidden="true"
          />
        </button>

        <span class="liturgy-web-control-bar__monitor-wrap">
          <button
            type="button"
            class="liturgy-web-control-bar__btn"
            title="Selecionar telas"
            aria-label="Selecionar telas"
            :aria-expanded="panelOpen ? 'true' : 'false'"
            @click.stop="togglePanel"
          >
            <i
              class="ti ti-device-desktop"
              aria-hidden="true"
            />
          </button>
          <span
            class="liturgy-web-control-bar__badge"
            :class="{ 'is-empty': screenCount === 0 }"
          >{{ screenCount }}</span>
        </span>

        <span
          v-if="showTransport"
          class="liturgy-web-control-bar__time"
        >{{ timeLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.liturgy-web-control-bar {
  position: absolute;
  inset: auto 0 0;
  z-index: 30;
  height: 48px;
  overflow: visible;
  color: #f1f5f9;
  font: 600 12px/1.2 system-ui, sans-serif;
  user-select: none;

  &.is-panel-open {
    // Garante que o painel não fique preso na altura da barra.
    overflow: visible;
  }
}

.liturgy-web-control-bar__bar {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.65rem;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 0.75rem;
  background: rgba(12, 12, 14, 0.92);

  &.has-transport,
  &.has-site-nav {
    grid-template-columns: auto 1fr auto;
  }

  &.has-site-nav:not(.has-transport) {
    grid-template-columns: 1fr auto;
  }
}

.liturgy-web-control-bar__transport,
.liturgy-web-control-bar__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.liturgy-web-control-bar__label {
  margin-left: 0.35rem;
  opacity: 0.75;
  white-space: nowrap;
}

.liturgy-web-control-bar__btn {
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  &.is-active {
    background: rgba(234, 88, 12, 0.28);
    color: #fb923c;
  }

  &--mirror {
    background: rgba(120, 214, 210, 0.18);
    color: #78d6d2;
  }

  .ti {
    font-size: 1.25rem;
    line-height: 1;
  }
}

.liturgy-web-control-bar__volume {
  width: 4.5rem;
  accent-color: #3b82f6;
  cursor: pointer;
}

.liturgy-web-control-bar__seek {
  width: 100%;
  accent-color: #3b82f6;
  cursor: pointer;
}

.liturgy-web-control-bar__time {
  min-width: 5.5rem;
  text-align: right;
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

.liturgy-web-control-bar__monitor-wrap {
  position: relative;
  display: inline-flex;
}

.liturgy-web-control-bar__badge {
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  min-width: 0.9rem;
  height: 0.9rem;
  padding: 0 0.2rem;
  border-radius: 999px;
  background: #fb923c;
  color: #111827;
  font-size: 0.62rem;
  line-height: 0.9rem;
  text-align: center;
  pointer-events: none;

  &.is-empty {
    display: none;
  }
}

.liturgy-web-control-bar__panel {
  position: absolute;
  right: 0.5rem;
  left: auto;
  bottom: calc(100% + 0.55rem);
  width: min(22rem, calc(100vw - 1rem));
  min-height: 10rem;
  max-height: min(18rem, calc(100vh - 5rem));
  padding: 0.85rem;
  border: 1px solid rgba(232, 237, 245, 0.12);
  border-radius: 0.65rem;
  background: rgba(26, 30, 40, 0.97);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
  overflow: auto;
  z-index: 40;
}

.liturgy-web-control-bar__panel-title {
  margin: 0;
  font-size: 1.08rem;
}

.liturgy-web-control-bar__panel-hint {
  margin: 0.55rem 0 0.7rem;
  font-weight: 500;
  opacity: 0.65;
}

.liturgy-web-control-bar__panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.liturgy-web-control-bar__option {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid rgba(232, 237, 245, 0.1);
  border-radius: 0.45rem;
  background: rgba(232, 237, 245, 0.04);
  cursor: pointer;

  &.is-active {
    border-color: rgba(251, 146, 60, 0.55);
    background: rgba(251, 146, 60, 0.12);
  }

  input {
    accent-color: #fb923c;
  }
}
</style>
