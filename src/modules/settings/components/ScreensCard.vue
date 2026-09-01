<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import {
  POPUP_ROUTABLE_MODULES,
  getPopupRoute,
  setPopupRoute,
  type PopupRoutableModule,
} from '@shared/services/popup-routing'
import { displayLabel } from '@shared/services/popup-outputs'
import { getPopupCount } from '@shared/services/projection-preferences'

import {
  useDesktopPalcoSession,
  type PalcoSlotInfo,
  type PalcoStatusInfo,
} from '../../remote/services/desktop-palco-session'

const { t } = useI18n()

/* ── Telas locais (popups) — autônomas, sem desktop ── */

const popupCount = computed(() => getPopupCount())

const modules: PopupRoutableModule[] = [...POPUP_ROUTABLE_MODULES]

const moduleLabelKeys: Record<PopupRoutableModule, string> = {
  bible: 'bible',
  media: 'media',
  'liturgy-web': 'liturgy',
  random: 'random',
  clock: 'clock',
  timer: 'timer',
  countdown: 'countdown',
}

function routeOf(module: PopupRoutableModule): string {
  return getPopupRoute(module)
}

function onRouteChange(module: PopupRoutableModule, event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  setPopupRoute(module, value)
}

function slotLabel(slot: number): string {
  return displayLabel(slot)
}

/* ── TVs (opcional, via desktop) ── */

const {
  connected,
  fetchStatus,
  fetchSlots,
  turnOn,
  turnOff,
  idle,
} = useDesktopPalcoSession()

const tvOpen = ref(false)
const loading = ref(false)
const toggling = ref(false)
const status = ref<PalcoStatusInfo | null>(null)
const slots = ref<PalcoSlotInfo[]>([])
const lastError = ref('')

let refreshTimer: ReturnType<typeof setInterval> | null = null

async function refresh(): Promise<void> {
  if (!connected.value || loading.value) return
  loading.value = true
  lastError.value = ''
  try {
    const [st, sl] = await Promise.all([fetchStatus(), fetchSlots()])
    status.value = st
    slots.value = sl
  } catch {
    lastError.value = t('settings.palco.statusError')
  } finally {
    loading.value = false
  }
}

async function togglePalco(): Promise<void> {
  if (toggling.value || !connected.value) return
  toggling.value = true
  lastError.value = ''
  try {
    const running = status.value?.running === true
    const ok = running ? await turnOff() : await turnOn()
    if (!ok) lastError.value = t('settings.palco.toggleError')
    await refresh()
  } catch {
    lastError.value = t('settings.palco.toggleError')
  } finally {
    toggling.value = false
  }
}

async function goIdle(): Promise<void> {
  if (toggling.value || !connected.value) return
  toggling.value = true
  lastError.value = ''
  try {
    const ok = await idle()
    if (!ok) lastError.value = t('settings.palco.toggleError')
    await refresh()
  } catch {
    lastError.value = t('settings.palco.toggleError')
  } finally {
    toggling.value = false
  }
}

function stopPolling(): void {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = null
}

watch([tvOpen, connected], ([open, conn]) => {
  stopPolling()
  if (open && conn) {
    void refresh()
    refreshTimer = setInterval(() => void refresh(), 3000)
  } else if (!open) {
    status.value = null
    slots.value = []
  }
}, { immediate: true })

onUnmounted(stopPolling)

function clientsLabel(count: number): string {
  return count === 1
    ? t('settings.palco.oneReceiver')
    : t('settings.palco.nReceivers', { n: count })
}
</script>

<template>
  <GlassCard class="screens-card" :padding="false">
    <!-- ═══ Seção 1: telas locais — funciona sozinha ═══ -->
    <div class="screens-card__header">
      <i class="ti ti-layout-navbar screens-card__icon" aria-hidden="true" />
      <div class="screens-card__heading">
        <h3 class="screens-card__title">
          {{ t('settings.screens.localTitle') }}
        </h3>
        <p class="screens-card__desc">
          {{ t('settings.screens.localDesc') }}
        </p>
      </div>
    </div>

    <p
      v-if="popupCount === 0"
      class="screens-card__hint"
    >
      {{ t('settings.screens.noPopups') }}
    </p>

    <ul
      v-else
      class="screens-card__routes"
    >
      <li
        v-for="module in modules"
        :key="module"
        class="screens-card__route"
      >
        <span class="screens-card__route-label">
          {{ t(`settings.screens.modules.${moduleLabelKeys[module]}`) }}
        </span>
        <select
          class="screens-card__route-select"
          :value="routeOf(module)"
          :aria-label="t('settings.screens.routeAria', { module: t(`settings.screens.modules.${moduleLabelKeys[module]}`) })"
          @change="onRouteChange(module, $event)"
        >
          <option value="mirror">
            {{ t('settings.screens.routeMirror') }}
          </option>
          <option
            v-for="slot in popupCount"
            :key="slot"
            :value="String(slot)"
          >
            {{ slotLabel(slot) }}
          </option>
        </select>
      </li>
    </ul>

    <p class="screens-card__note">
      {{ t('settings.screens.routeHint') }}
    </p>

    <!-- ═══ Separador ═══ -->
    <div
      class="screens-card__divider"
      role="separator"
    />

    <!-- ═══ Seção 2: TVs reais — opcional, via desktop ═══ -->
    <button
      type="button"
      class="screens-card__tv-toggle"
      :aria-expanded="tvOpen"
      @click="tvOpen = !tvOpen"
    >
      <i class="ti ti-device-tv" aria-hidden="true" />
      <span class="screens-card__tv-title">{{ t('settings.palco.tvs') }}</span>
      <span
        class="screens-card__tv-badge"
        :class="{ 'screens-card__tv-badge--on': connected }"
      >
        {{ connected ? t('settings.palco.desktopConnected') : t('settings.palco.desktopOffline') }}
      </span>
      <i
        class="ti ti-chevron-down screens-card__tv-chevron"
        :class="{ 'screens-card__tv-chevron--open': tvOpen }"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="tvOpen"
      class="screens-card__tv-body"
    >
      <p class="screens-card__tv-hint">
        {{ connected
          ? t('settings.screens.tvConnectedHint')
          : t('settings.screens.tvOfflineHint') }}
      </p>

      <template v-if="connected">
        <div class="screens-card__summary">
          <span>{{ t('settings.palco.senderStatus') }}:</span>
          <strong>{{ status?.running ? t('settings.palco.senderOn') : t('settings.palco.senderOff') }}</strong>
          <span v-if="status?.running">· {{ clientsLabel(status.clients) }}</span>
          <span class="screens-card__actions">
            <button
              type="button"
              class="screens-card__btn screens-card__btn--primary"
              :disabled="toggling"
              @click="togglePalco"
            >
              {{ status?.running ? t('settings.palco.actionOff') : t('settings.palco.actionOn') }}
            </button>
            <button
              v-if="status?.running"
              type="button"
              class="screens-card__btn"
              :disabled="toggling"
              @click="goIdle"
            >
              {{ t('settings.palco.actionIdle') }}
            </button>
          </span>
        </div>

        <ul class="screens-card__slots">
          <li
            v-for="slot in slots"
            :key="slot.id"
            class="screens-card__slot"
          >
            <span class="screens-card__slot-label">{{ slot.label }}</span>
            <span
              class="screens-card__slot-state"
              :class="{ 'screens-card__slot-state--on': slot.running }"
            >
              {{ slot.running ? t('settings.palco.slotOn') : t('settings.palco.slotOff') }}
            </span>
            <span
              v-if="slot.running"
              class="screens-card__slot-clients"
            >
              {{ clientsLabel(slot.clients) }}
            </span>
          </li>
        </ul>

        <p
          v-if="!slots.length && !loading"
          class="screens-card__hint"
        >
          {{ t('settings.palco.noSlots') }}
        </p>
      </template>

      <p
        v-else
        class="screens-card__hint"
      >
        {{ t('settings.screens.tvHowTo') }}
      </p>

      <p
        v-if="lastError"
        class="screens-card__error"
        role="alert"
      >
        {{ lastError }}
      </p>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.screens-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;

  @media (max-width: 900px) {
    padding: 1rem;
  }
}

.screens-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.screens-card__icon {
  font-size: 1.4rem;
  color: var(--ds-color-primary, #2196f3);
}

.screens-card__heading {
  flex: 1;
  min-width: 0;
}

.screens-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.screens-card__desc {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.6);
}

.screens-card__hint {
  margin: 0;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.55);
}

.screens-card__routes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.screens-card__route {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.65rem 0 0.65rem 0;
  background: rgb(255 255 255 / 0.045);
  font-size: 0.84rem;
}

.screens-card__route-label {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}

.screens-card__route-select {
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 0.5rem;
  background: rgb(20 20 20 / 0.9);
  color: #fff;
  font-size: 0.78rem;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
}

.screens-card__note {
  margin: 0;
  font-size: 0.72rem;
  color: rgb(255 255 255 / 0.45);
}

.screens-card__divider {
  height: 1px;
  background: rgb(255 255 255 / 0.08);
  margin: 0.25rem 0;
}

.screens-card__tv-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0;
  text-align: left;
}

.screens-card__tv-title {
  flex: 1;
}

.screens-card__tv-badge {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  background: rgb(158 158 158 / 0.16);
  color: rgb(255 255 255 / 0.55);
}

.screens-card__tv-badge--on {
  background: rgb(76 175 80 / 0.18);
  color: #81c784;
}

.screens-card__tv-chevron {
  transition: transform 0.2s ease;
}

.screens-card__tv-chevron--open {
  transform: rotate(180deg);
}

.screens-card__tv-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-left: 1.4rem;
}

.screens-card__tv-hint {
  margin: 0;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 0.55);
}

.screens-card__summary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: rgb(255 255 255 / 0.72);
}

.screens-card__actions {
  display: inline-flex;
  gap: 0.4rem;
  margin-left: auto;
}

.screens-card__btn {
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  background: transparent;
  color: #fff;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgb(255 255 255 / 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.screens-card__btn--primary {
  background: var(--ds-color-primary, #2196f3);
  border-color: transparent;
}

.screens-card__slots {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.screens-card__slot {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem 0 0.65rem 0;
  background: rgb(255 255 255 / 0.045);
  font-size: 0.82rem;
}

.screens-card__slot-label {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}

.screens-card__slot-state {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(255 255 255 / 0.5);
}

.screens-card__slot-state--on {
  color: #81c784;
}

.screens-card__slot-clients {
  font-size: 0.74rem;
  color: rgb(255 255 255 / 0.6);
}

.screens-card__error {
  margin: 0;
  font-size: 0.78rem;
  color: #ef9a9a;
}
</style>
