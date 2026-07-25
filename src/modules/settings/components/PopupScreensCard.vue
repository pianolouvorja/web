<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import { useProjectionSettings } from '../composables/useProjectionSettings'

const { t } = useI18n()
const {
  popupCount,
  countMin,
  countMax,
  sliderFill,
  decrementPopupCount,
  incrementPopupCount,
  onPopupCountInput,
} = useProjectionSettings()
</script>

<template>
  <GlassCard class="popup-screens" :padding="false">
    <div class="popup-screens__header">
      <i class="ti ti-devices popup-screens__icon" aria-hidden="true" />
      <div class="popup-screens__heading">
        <h3 class="popup-screens__title">
          {{ t('settings.projection.popupScreens') }}
        </h3>
        <p class="popup-screens__desc">
          {{ t('settings.projection.popupScreensDesc') }}
        </p>
      </div>
    </div>

    <div class="popup-screens__label-row">
      <span class="popup-screens__label">
        {{ t('settings.projection.popupCountLabel') }}
      </span>
      <span class="popup-screens__badge" aria-live="polite">
        {{ popupCount }}
      </span>
    </div>

    <div class="popup-screens__slider-row">
      <button
        type="button"
        class="popup-screens__step"
        :disabled="popupCount <= countMin"
        :aria-label="t('settings.projection.decreaseScreens')"
        @click="decrementPopupCount"
      >
        <i class="ti ti-minus" aria-hidden="true" />
      </button>

      <label class="popup-screens__slider-wrap">
        <span class="sr-only">{{ t('settings.projection.popupCountLabel') }}</span>
        <input
          class="popup-screens__range"
          type="range"
          :min="countMin"
          :max="countMax"
          step="1"
          :value="popupCount"
          :style="{ '--slider-fill': sliderFill }"
          @input="onPopupCountInput"
        />
      </label>

      <button
        type="button"
        class="popup-screens__step"
        :disabled="popupCount >= countMax"
        :aria-label="t('settings.projection.increaseScreens')"
        @click="incrementPopupCount"
      >
        <i class="ti ti-plus" aria-hidden="true" />
      </button>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.popup-screens {
  padding: 1.5rem;
}

.popup-screens__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.popup-screens__icon {
  color: var(--ds-color-primary);
  font-size: 28px;
  line-height: 1;
}

.popup-screens__heading {
  min-width: 0;
}

.popup-screens__title {
  margin: 0;
  color: var(--ds-color-on-surface);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.popup-screens__desc {
  margin: 0.15rem 0 0;
  color: var(--ds-color-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.35;
}

.popup-screens__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.popup-screens__label {
  color: var(--ds-color-on-surface);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25;
}

.popup-screens__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  border-radius: var(--ds-radius-full);
  background: color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
  color: var(--ds-color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
}

.popup-screens__slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.popup-screens__step {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: var(--ds-radius-full);
  background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  color: var(--ds-color-primary);
  cursor: pointer;
  transition:
    background-color var(--ds-motion-duration, 200ms) ease,
    opacity var(--ds-motion-duration, 200ms) ease,
    transform 150ms ease;

  .ti {
    font-size: 18px;
    line-height: 1;
  }

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-primary);
    outline-offset: 2px;
  }
}

.popup-screens__slider-wrap {
  flex: 1;
  min-width: 0;
}

.popup-screens__range {
  display: block;
  width: 100%;
  height: 24px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-primary);
    outline-offset: 4px;
    border-radius: var(--ds-radius-sm);
  }

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      var(--ds-color-primary) 0%,
      var(--ds-color-primary) var(--slider-fill, 0%),
      color-mix(in srgb, var(--ds-color-on-surface) 12%, transparent)
        var(--slider-fill, 0%),
      color-mix(in srgb, var(--ds-color-on-surface) 12%, transparent) 100%
    );
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    margin-top: -7px;
    border-radius: var(--ds-radius-full);
    background: var(--ds-color-primary);
    box-shadow: 0 0 10px color-mix(in srgb, var(--ds-color-primary) 40%, transparent);
  }

  &::-moz-range-track {
    height: 4px;
    border: 0;
    border-radius: 2px;
    background: color-mix(in srgb, var(--ds-color-on-surface) 12%, transparent);
  }

  &::-moz-range-progress {
    height: 4px;
    border-radius: 2px;
    background: var(--ds-color-primary);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border: 0;
    border-radius: var(--ds-radius-full);
    background: var(--ds-color-primary);
    box-shadow: 0 0 10px color-mix(in srgb, var(--ds-color-primary) 40%, transparent);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
