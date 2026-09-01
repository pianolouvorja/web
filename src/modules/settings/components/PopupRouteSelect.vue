<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  getPopupRoute,
  setPopupRoute,
  type PopupRoutableModule,
} from '@shared/services/popup-routing'
import { getPopupCount } from '@shared/services/projection-preferences'

/**
 * Paridade do PalcoRouteSelect do desktop: seletor compact no header de cada
 * módulo. No web os destinos são as popups deste navegador. Sempre visível
 * (não depende de nada externo).
 */
const props = defineProps<{ module: PopupRoutableModule; compact?: boolean }>()

const { t } = useI18n()

const popupCount = computed(() => getPopupCount())

function update(value: string): void {
  setPopupRoute(props.module, value)
}
</script>

<template>
  <label
    class="popup-route"
    :class="{ 'popup-route--compact': props.compact }"
  >
    <i
      class="ti ti-devices"
      aria-hidden="true"
    />
    <span>{{ t('settings.screens.route') }}</span>
    <select
      :value="getPopupRoute(props.module)"
      @change="update(($event.target as HTMLSelectElement).value)"
    >
      <option value="mirror">
        {{ t('settings.screens.mirror') }}
      </option>
      <option value="tv">
        {{ t('settings.screens.routeTv') }}
      </option>
      <optgroup
        v-if="popupCount > 0"
        :label="t('settings.screens.screensOfStage')"
      >
        <option
          v-for="slot in popupCount"
          :key="slot"
          :value="String(slot)"
        >
          {{ slot === 1 ? t('settings.screens.mainScreen') : t('settings.screens.screenN', { n: slot }) }}
        </option>
      </optgroup>
    </select>
  </label>
</template>

<style scoped lang="scss">
.popup-route {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ds-color-on-surface-variant, rgb(255 255 255 / 0.6));
  font-size: 0.72rem;
}

.popup-route .ti {
  color: var(--ds-color-primary, #f59e0b);
}

.popup-route select {
  max-width: 9rem;
  padding: 0.3rem 0.45rem;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 0.4rem 0 0.4rem 0;
  background: var(--ds-color-surface, #141414);
  color: var(--ds-color-on-surface, #fff);
  font-size: 0.72rem;
  cursor: pointer;
}

.popup-route--compact span {
  display: none;
}
</style>
