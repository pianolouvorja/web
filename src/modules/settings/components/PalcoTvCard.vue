<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import {
  useDesktopPalcoSession,
  type PalcoSlotInfo,
  type PalcoStatusInfo,
} from '../../remote/services/desktop-palco-session'

const { t } = useI18n()
const { connected, fetchStatus, fetchSlots, turnOn, turnOff, idle } = useDesktopPalcoSession()

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

function startPolling(): void {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(() => void refresh(), 3000)
}

function stopPolling(): void {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = null
}

function togglePolling(): void {
  if (connected.value) {
    void refresh()
    startPolling()
  } else {
    stopPolling()
    status.value = null
    slots.value = []
  }
}

function clientsLabel(count: number): string {
  return count === 1
    ? t('settings.palco.oneReceiver')
    : t('settings.palco.nReceivers', { n: count })
}

watch(connected, togglePolling, { immediate: true })
onUnmounted(stopPolling)
</script>

<template>
  <GlassCard class="palco-tv-card" :padding="false">
    <div class="palco-tv-card__header">
      <i class="ti ti-device-tv palco-tv-card__icon" aria-hidden="true" />
      <div class="palco-tv-card__heading">
        <h3 class="palco-tv-card__title">
          {{ t('settings.palco.tvs') }}
        </h3>
        <p class="palco-tv-card__desc">
          {{ t('settings.palco.webHint') }}
        </p>
      </div>
      <span
        class="palco-tv-card__badge"
        :class="{ 'palco-tv-card__badge--off': !connected }"
        aria-live="polite"
      >
        {{ connected ? t('settings.palco.desktopConnected') : t('settings.palco.desktopOffline') }}
      </span>
    </div>

    <p v-if="!connected" class="palco-tv-card__empty">
      {{ t('settings.palco.connectFirst') }}
    </p>

    <template v-else>
      <div class="palco-tv-card__summary">
        <span>{{ t('settings.palco.senderStatus') }}:</span>
        <strong>{{ status?.running ? t('settings.palco.senderOn') : t('settings.palco.senderOff') }}</strong>
        <span v-if="status?.running">· {{ clientsLabel(status.clients) }}</span>
        <span class="palco-tv-card__actions">
          <button
            type="button"
            class="palco-tv-card__btn palco-tv-card__btn--primary"
            :disabled="toggling"
            @click="togglePalco"
          >
            {{ status?.running ? t('settings.palco.actionOff') : t('settings.palco.actionOn') }}
          </button>
          <button
            v-if="status?.running"
            type="button"
            class="palco-tv-card__btn"
            :disabled="toggling"
            @click="goIdle"
          >
            {{ t('settings.palco.actionIdle') }}
          </button>
        </span>
      </div>

      <ul class="palco-tv-card__slots">
        <li
          v-for="slot in slots"
          :key="slot.id"
          class="palco-tv-card__slot"
        >
          <span class="palco-tv-card__slot-label">{{ slot.label }}</span>
          <span
            class="palco-tv-card__slot-state"
            :class="{ 'palco-tv-card__slot-state--on': slot.running }"
          >
            {{ slot.running ? t('settings.palco.slotOn') : t('settings.palco.slotOff') }}
          </span>
          <span v-if="slot.running" class="palco-tv-card__slot-clients">
            {{ clientsLabel(slot.clients) }}
          </span>
        </li>
      </ul>

      <p v-if="!slots.length && !loading" class="palco-tv-card__empty">
        {{ t('settings.palco.noSlots') }}
      </p>
      <p v-if="lastError" class="palco-tv-card__error" role="alert">
        {{ lastError }}
      </p>
    </template>
  </GlassCard>
</template>

<style scoped lang="scss">
.palco-tv-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.palco-tv-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.palco-tv-card__icon {
  font-size: 1.4rem;
  color: var(--ds-color-primary, #2196f3);
}

.palco-tv-card__heading {
  flex: 1;
  min-width: 0;
}

.palco-tv-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.palco-tv-card__desc {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.6);
}

.palco-tv-card__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgb(76 175 80 / 0.18);
  color: #81c784;
}

.palco-tv-card__badge--off {
  background: rgb(158 158 158 / 0.16);
  color: rgb(255 255 255 / 0.55);
}

.palco-tv-card__summary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: rgb(255 255 255 / 0.72);
}

.palco-tv-card__actions {
  display: inline-flex;
  gap: 0.4rem;
  margin-left: auto;
}

.palco-tv-card__btn {
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

.palco-tv-card__btn--primary {
  background: var(--ds-color-primary, #2196f3);
  border-color: transparent;
}

.palco-tv-card__slots {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.palco-tv-card__slot {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem 0 0.65rem 0;
  background: rgb(255 255 255 / 0.045);
  font-size: 0.82rem;
}

.palco-tv-card__slot-label {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}

.palco-tv-card__slot-state {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(255 255 255 / 0.5);
}

.palco-tv-card__slot-state--on {
  color: #81c784;
}

.palco-tv-card__slot-clients {
  font-size: 0.74rem;
  color: rgb(255 255 255 / 0.6);
}

.palco-tv-card__empty {
  margin: 0;
  font-size: 0.82rem;
  color: rgb(255 255 255 / 0.55);
}

.palco-tv-card__error {
  margin: 0;
  font-size: 0.78rem;
  color: #ef9a9a;
}
</style>
