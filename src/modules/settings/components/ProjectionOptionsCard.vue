<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import { useProjectionSettings } from '../composables/useProjectionSettings'
import SettingsToggle from './SettingsToggle.vue'

const { t } = useI18n()
const { hardwareAccel, fullscreenMode } = useProjectionSettings()
</script>

<template>
  <GlassCard class="projection-options" :padding="false">
    <div class="projection-options__row">
      <span class="projection-options__label">
        {{ t('settings.projection.hardwareAccel') }}
      </span>
      <SettingsToggle
        v-model="hardwareAccel"
        :label="t('settings.projection.hardwareAccel')"
      />
    </div>

    <div class="projection-options__row">
      <span class="projection-options__label">
        {{ t('settings.projection.fullscreenMode') }}
      </span>
      <SettingsToggle
        v-model="fullscreenMode"
        :label="t('settings.projection.fullscreenMode')"
      />
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.projection-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

.projection-options__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.projection-options__label {
  color: var(--ds-color-on-surface);
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
}
</style>
