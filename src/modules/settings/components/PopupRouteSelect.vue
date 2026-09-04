<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  getPopupRoute,
  setPopupRoute,
  type PopupRoutableModule,
} from '@shared/services/popup-routing'
import { getPopupCount } from '@shared/services/projection-preferences'
import { listScreens, type WebScreen } from '@shared/services/display-service-web'
import {
  assignScreenToSlot,
  loadSlotAssignments,
  pickSlotForScreen,
} from '@shared/services/slot-monitors'

/**
 * Paridade do PalcoRouteSelect do desktop: seletor compact no header de cada
 * módulo. 'Só Palco (TV/monitor)' usa receivers relay (TV ou Chrome kiosk)
 * e evita popup local; 'Espelhar todas' preserva popup + relay.
 */
const props = defineProps<{ module: PopupRoutableModule; compact?: boolean }>()

const { t } = useI18n()

const popupCount = computed(() => getPopupCount())
const selectedRoute = ref(getPopupRoute(props.module))
const detectedScreens = ref<WebScreen[]>([])

function slotLabel(slotId: number): string {
  const base = slotId === 1
    ? t('settings.screens.mainScreen')
    : t('settings.screens.screenN', { n: slotId })
  const screenId = loadSlotAssignments()[String(slotId)]
  const screen = detectedScreens.value.find((item) => item.id === screenId)
  return screen ? `${base} — ${screen.label || t('settings.screens.monitorN', { n: detectedScreens.value.indexOf(screen) + 1 })}` : base
}

onMounted(() => {
  void listScreens().then((result) => {
    // Sem permissão a API devolve somente a tela atual; não duplicar o slot.
    if (!result.limited) detectedScreens.value = result.screens
  })
})

function update(value: string): void {
  if (!value.startsWith('monitor:')) {
    selectedRoute.value = value
    setPopupRoute(props.module, value)
    return
  }

  const screen = detectedScreens.value.find((item) => item.id === value.slice('monitor:'.length))
  if (!screen) return
  const slotId = pickSlotForScreen(screen.id, popupCount.value)
  assignScreenToSlot(slotId, screen)
  // O módulo passa a projetar só no slot que acabou de receber o monitor.
  selectedRoute.value = slotId
  setPopupRoute(props.module, slotId)
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
      :value="selectedRoute"
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
          {{ slotLabel(slot) }}
        </option>
      </optgroup>
      <optgroup
        v-if="detectedScreens.length > 1"
        :label="t('settings.screens.detectedTitle')"
      >
        <option
          v-for="(screen, index) in detectedScreens"
          :key="screen.id"
          :value="`monitor:${screen.id}`"
        >
          {{ screen.label || t('settings.screens.monitorN', { n: index + 1 }) }} · {{ screen.width }} × {{ screen.height }}
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
