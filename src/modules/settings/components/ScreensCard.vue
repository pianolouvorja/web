<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import {
  POPUP_ROUTABLE_MODULES,
  getPopupRoute,
  setPopupRoute,
  type PopupRoutableModule,
} from '@shared/services/popup-routing'
import { getPopupCount } from '@shared/services/projection-preferences'

/**
 * Paridade 1:1 com PalcoCard + PalcoSlotsCard do desktop.
 * No web as "telas" são popups deste navegador: dot verde quando a popup
 * está aberta, selecionada = alvo do projeto, play = abrir/fechar popup.
 * Roteamento por módulo embaixo, igual "Espelhar (todas) ou uma tela".
 */

const { t } = useI18n()

const popupCount = ref(getPopupCount())
const activeId = ref('1')

const slots = computed(() =>
  Array.from({ length: popupCount.value }, (_, i) => ({
    id: String(i + 1),
    alive: false, // runtime check: BroadcastChannel heartbeat (WT-4b follow-up)
  })),
)

function selectSlot(id: string): void {
  activeId.value = id
}

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

let timer: ReturnType<typeof setInterval> | null = null
timer = setInterval(() => {
  popupCount.value = getPopupCount()
}, 3000)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <GlassCard class="palco-slots-card" :padding="false">
    <div class="palco-slots-card__header">
      <div>
        <h3>{{ t('settings.screens.screensOfStage') }}</h3>
        <p>{{ t('settings.screens.screensHint') }}</p>
      </div>
    </div>

    <div class="palco-slots-card__list">
      <div
        v-for="slot in slots"
        :key="slot.id"
        class="palco-slot"
        :class="{ 'palco-slot--active': activeId === slot.id }"
      >
        <button
          type="button"
          class="palco-slot__select"
          @click="selectSlot(slot.id)"
        >
          <span
            class="palco-slot__dot"
            :class="{ 'palco-slot__dot--on': slot.alive }"
          />
          <span>
            <strong>{{ slot.id === '1' ? t('settings.screens.mainScreen') : t('settings.screens.screenN', { n: slot.id }) }}</strong>
            <small>{{ t('settings.screens.waitingScreen') }}</small>
          </span>
        </button>
        <span
          v-if="activeId === slot.id"
          class="palco-slot__badge"
        >{{ t('settings.screens.selected') }}</span>
        <button
          type="button"
          class="palco-slot__power"
          :aria-label="t('settings.screens.openScreen')"
          @click="selectSlot(slot.id)"
        >
          <i
            class="ti ti-player-play"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <p class="palco-slots-card__note">
      {{ t('settings.screens.moduleHint') }}
    </p>

    <!-- Roteamento por módulo (Espelhar todas / tela individual) -->
    <div class="palco-slots-card__routes">
      <label
        v-for="module in modules"
        :key="module"
        class="palco-slots-card__route"
      >
        <span>{{ t(`settings.screens.modules.${moduleLabelKeys[module]}`) }}</span>
        <select
          :value="routeOf(module)"
          @change="onRouteChange(module, $event)"
        >
          <option value="mirror">
            {{ t('settings.screens.mirror') }}
          </option>
          <option
            v-for="slot in slots"
            :key="slot.id"
            :value="slot.id"
          >
            {{ slot.id === '1' ? t('settings.screens.mainScreen') : t('settings.screens.screenN', { n: slot.id }) }}
          </option>
        </select>
      </label>
    </div>

    <p class="palco-slots-card__foot">
      {{ t('settings.screens.localNote') }}
    </p>
  </GlassCard>
</template>

<style scoped lang="scss">
.palco-slots-card { overflow: hidden; }
.palco-slots-card__header { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem 1.25rem .75rem; }
.palco-slots-card h3 { margin:0; color:var(--ds-color-on-surface); font-size:1rem; }
.palco-slots-card__header p { margin:.2rem 0 0; color:var(--ds-color-on-surface-variant); font-size:.75rem; }
.palco-slots-card__list { display:flex; flex-direction:column; gap:.35rem; padding:.5rem 1.25rem 1rem; }
.palco-slot { display:flex; align-items:center; gap:.5rem; padding:.55rem .65rem; border:1px solid transparent; border-radius:.5rem 0 .5rem 0; background:color-mix(in srgb,var(--ds-color-on-surface) 5%,transparent); }
.palco-slot--active { border-color:color-mix(in srgb,var(--ds-color-primary) 45%,transparent); background:color-mix(in srgb,var(--ds-color-primary) 8%,transparent); }
.palco-slot__select { display:flex; align-items:center; gap:.65rem; min-width:0; flex:1; border:0; background:none; color:var(--ds-color-on-surface); text-align:left; cursor:pointer; }
.palco-slot__select strong,.palco-slot__select small { display:block; }
.palco-slot__select small { margin-top:.15rem; color:var(--ds-color-on-surface-variant); font-size:.7rem; }
.palco-slot__dot { width:.55rem; height:.55rem; flex:none; border-radius:50%; background:var(--ds-color-on-surface-variant); opacity:.45; }
.palco-slot__dot--on { background:#39c56b; opacity:1; box-shadow:0 0 0 3px color-mix(in srgb,#39c56b 18%,transparent); }
.palco-slot__badge { color:var(--ds-color-primary); font-size:.65rem; }
.palco-slot__power { display:flex; align-items:center; justify-content:center; width:1.8rem; height:1.8rem; border:0; border-radius:.35rem; background:transparent; color:var(--ds-color-on-surface-variant); cursor:pointer; }
.palco-slot__power:hover { color:var(--ds-color-primary); background:color-mix(in srgb,var(--ds-color-primary) 12%,transparent); }
.palco-slots-card__note { padding:0 1.25rem .5rem; font-size:.75rem; color:var(--ds-color-on-surface-variant); }

.palco-slots-card__routes { display:flex; flex-direction:column; gap:.35rem; padding:0 1.25rem .75rem; }
.palco-slots-card__route { display:flex; align-items:center; justify-content:space-between; gap:.6rem; font-size:.78rem; color:var(--ds-color-on-surface); }
.palco-slots-card__route select { max-width:9.5rem; padding:.28rem .45rem; border:1px solid color-mix(in srgb,var(--ds-color-on-surface) 18%,transparent); border-radius:.4rem 0 .4rem 0; background:var(--ds-color-surface); color:var(--ds-color-on-surface); font-size:.72rem; cursor:pointer; }

.palco-slots-card__foot { padding:0 1.25rem 1rem; font-size:.7rem; color:var(--ds-color-on-surface-variant); opacity:.75; }
</style>
