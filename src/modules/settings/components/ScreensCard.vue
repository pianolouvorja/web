<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import {
  POPUP_ROUTABLE_MODULES,
  getPopupRoute,
  setPopupRoute,
  type PopupRoutableModule,
} from '@shared/services/popup-routing'
import { getPopupCount } from '@shared/services/projection-preferences'

const { t } = useI18n()

/* Paridade desktop: um card "Palco (Telas)" com toggle + lista de telas com
 * dot, seleção, e roteamento por módulo ("Espelhar todas" / tela específica).
 * No web as "telas" são popups deste navegador — funciona sozinho. */

const popupCount = computed(() => getPopupCount())

const slotsList = computed(() =>
  Array.from({ length: popupCount.value }, (_, i) => i + 1),
)

const selectedSlot = ref('0') // '0' = principal/espelho

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
  setPopupRoute(module, (event.target as HTMLSelectElement).value)
}

function screenLabel(slot: number): string {
  return slot === 1
    ? t('settings.screens.mainScreen')
    : t('settings.screens.screenN', { n: slot })
}
</script>

<template>
  <GlassCard
    class="screens-card"
    :padding="false"
  >
    <!-- Toggle principal (paridade PalcoCard do desktop) -->
    <div class="screens-card__header">
      <div class="screens-card__heading">
        <div class="screens-card__icon">
          <i
            class="ti ti-devices"
            aria-hidden="true"
          />
        </div>
        <div>
          <h3 class="screens-card__title">
            {{ t('settings.screens.title') }}
          </h3>
          <p class="screens-card__subtitle">
            {{ t('settings.screens.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Lista de telas (paridade PalcoSlotsCard do desktop) -->
    <div
      v-if="popupCount > 0"
      class="screens-card__body"
    >
      <div class="screens-card__list-head">
        <div>
          <h4 class="screens-card__list-title">
            {{ t('settings.screens.screensOfStage') }}
          </h4>
          <p class="screens-card__list-hint">
            {{ t('settings.screens.screensHint') }}
          </p>
        </div>
      </div>

      <ul class="screens-card__list">
        <li
          v-for="slot in slotsList"
          :key="slot"
          class="screens-card__item"
          :class="{ 'screens-card__item--selected': selectedSlot === String(slot) }"
        >
          <span
            class="screens-card__dot"
            aria-hidden="true"
          />
          <div class="screens-card__item-info">
            <span class="screens-card__item-name">{{ screenLabel(slot) }}</span>
            <span class="screens-card__item-sub">
              {{ t('settings.screens.waitingScreen') }}
            </span>
          </div>
          <button
            type="button"
            class="screens-card__select-btn"
            :disabled="selectedSlot === String(slot)"
            @click="selectedSlot = String(slot)"
          >
            {{ selectedSlot === String(slot) ? t('settings.screens.selected') : '' }}
            <i
              v-if="selectedSlot !== String(slot)"
              class="ti ti-player-play"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>

      <p class="screens-card__foot-hint">
        {{ t('settings.screens.moduleHint') }}
      </p>

      <!-- Roteamento por módulo (Espelhar / tela individual) -->
      <ul class="screens-card__routes">
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
              {{ t('settings.screens.mirror') }}
            </option>
            <option
              v-for="slot in slotsList"
              :key="slot"
              :value="String(slot)"
            >
              {{ screenLabel(slot) }}
            </option>
          </select>
        </li>
      </ul>
    </div>

    <p
      v-else
      class="screens-card__hint"
    >
      {{ t('settings.screens.noPopups') }}
    </p>

    <p class="screens-card__note">
      {{ t('settings.screens.localNote') }}
    </p>
  </GlassCard>
</template>

<style scoped lang="scss">
.screens-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.5rem;

  @media (max-width: 900px) {
    padding: 1rem;
  }
}

.screens-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.screens-card__heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.screens-card__icon {
  width: 2.4rem;
  height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgb(245 158 11 / 0.12);
  color: #f59e0b;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.screens-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.screens-card__subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.6);
}

.screens-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.screens-card__list-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.screens-card__list-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
}

.screens-card__list-hint {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 0.55);
}

.screens-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.screens-card__item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.65rem 0 0.65rem 0;
  background: rgb(255 255 255 / 0.04);
  border: 1px solid transparent;

  &--selected {
    background: rgb(245 158 11 / 0.07);
    border-color: rgb(245 158 11 / 0.35);
  }
}

.screens-card__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.25);
  flex-shrink: 0;
}

.screens-card__item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.screens-card__item-name {
  font-weight: 600;
  font-size: 0.86rem;
}

.screens-card__item-sub {
  font-size: 0.74rem;
  color: rgb(255 255 255 / 0.5);
}

.screens-card__select-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  color: #f59e0b;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.4rem;

  &:disabled {
    cursor: default;
    opacity: 0.9;
  }
}

.screens-card__foot-hint {
  margin: 0;
  font-size: 0.74rem;
  color: rgb(255 255 255 / 0.45);
}

.screens-card__routes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.screens-card__route {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.6rem 0 0.6rem 0;
  background: rgb(255 255 255 / 0.035);
  font-size: 0.82rem;
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
  padding: 0.28rem 0.5rem;
  cursor: pointer;
}

.screens-card__hint {
  margin: 0;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.55);
}

.screens-card__note {
  margin: 0;
  font-size: 0.72rem;
  color: rgb(255 255 255 / 0.4);
}
</style>
