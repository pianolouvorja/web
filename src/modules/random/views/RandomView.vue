<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { readEffectiveStageSettings, subscribeStageSettings } from '../../settings/services/stage-settings-runtime'
import type { StageSettings } from '../../settings/types/stage-settings'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import StagePaletteButton from '../../settings/components/StagePaletteButton.vue'
import RandomAvailablePanel from '../components/RandomAvailablePanel.vue'
import RandomConfigDialog from '../components/RandomConfigDialog.vue'
import RandomHistoryPanel from '../components/RandomHistoryPanel.vue'
import RandomProjectFab from '../components/RandomProjectFab.vue'
import RandomStage from '../components/RandomStage.vue'
import { useRandomFeature } from '../composables/useRandom'
import type { RandomDrawMode } from '../types/random'

const { t } = useI18n()
const router = useRouter()

const {
  config,
  session,
  runtime,
  draftName,
  isProjecting,
  configOpen,
  rangeError,
  canDraw,
  drawnReversed,
  setMode,
  setNumberMin,
  setNumberMax,
  setDraftName,
  addName,
  removeAvailable,
  clearAvailable,
  removeDrawn,
  clearHistory,
  resetAll,
  importNamesFromText,
  generateNumberRange,
  startDraw,
  setBgColor,
  setTextColor,
  setFontSizePc,
  setTextTransform,
  setAnimationSpeed,
  resetDisplayToDefault,
  openConfig,
  closeConfig,
  toggleProjection,
  clearProjection,
} = useRandomFeature()

function goBack() {
  router.push({ name: 'utilities' })
}

function onToggleProjection() {
  toggleProjection()
}

function onResetAll() {
  if (window.confirm(t('random.resetConfirm'))) {
    resetAll()
  }
}

function onModeChange(mode: RandomDrawMode) {
  setMode(mode)
}

async function onImportFile(file: File) {
  try {
    const text = await file.text()
    importNamesFromText(text)
  } catch {
    // falha de leitura: mantém lista atual
  }
}

const stage = ref<StageSettings>(readEffectiveStageSettings('random'))
let unsubStage: (() => void) | null = null
onMounted(() => { unsubStage = subscribeStageSettings(() => { stage.value = readEffectiveStageSettings('random') }) })
onUnmounted(() => unsubStage?.())

// Características do módulo vindas do StageSettings (fonte única).
const effectiveConfig = computed(() => {
  const mod = stage.value.random
  return mod ? { ...config.value, ...mod } : { ...config.value }
})
</script>

<template>
  <section class="random-view">
    <header class="random-view__header">
      <button
        type="button"
        class="random-view__back"
        :aria-label="t('random.backToUtilities')"
        @click="goBack"
      >
        <i
          class="ti ti-arrow-left"
          aria-hidden="true"
        />
      </button>

      <div class="random-view__brand">
        <div class="random-view__brand-icon">
          <i
            class="ti ti-ticket"
            aria-hidden="true"
          />
        </div>
        <h1 class="random-view__title">
          {{ t('random.title') }}
        </h1>

        <div
          class="random-view__modes"
          role="radiogroup"
          :aria-label="t('random.title')"
        >
          <button
            type="button"
            class="random-view__mode"
            :class="{ 'random-view__mode--active': session.mode === 'names' }"
            role="radio"
            :aria-checked="session.mode === 'names'"
            @click="onModeChange('names')"
          >
            {{ t('random.modeNames') }}
          </button>
          <button
            type="button"
            class="random-view__mode"
            :class="{ 'random-view__mode--active': session.mode === 'numbers' }"
            role="radio"
            :aria-checked="session.mode === 'numbers'"
            @click="onModeChange('numbers')"
          >
            {{ t('random.modeNumbers') }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="random-view__reset"
        @click="onResetAll"
      >
        <i
          class="ti ti-refresh"
          aria-hidden="true"
        />
        {{ t('random.resetAll') }}
      </button>
    </header>
    <StagePaletteButton scope="random" />

    <div class="random-view__content">
      <div class="random-view__panel random-view__panel--available">
        <RandomAvailablePanel
          :mode="session.mode"
          :available="session.available"
          :drawn="session.drawn"
          :draft-name="draftName"
          :number-min="session.numberMin"
          :number-max="session.numberMax"
          :range-error="rangeError"
          @update:draft-name="setDraftName"
          @update:number-min="setNumberMin"
          @update:number-max="setNumberMax"
          @add="addName()"
          @import-file="onImportFile"
          @generate-range="generateNumberRange"
          @remove="removeAvailable"
          @clear="clearAvailable"
        />
      </div>

      <div class="random-view__stage">
        <RandomStage
          :config="effectiveConfig"
          :runtime="runtime"
          :can-draw="canDraw"
          :is-projecting="isProjecting"
          preview
          @draw="startDraw"
          @open-config="openConfig"
        />
      </div>

      <div class="random-view__panel random-view__panel--history">
        <RandomHistoryPanel
          :items="drawnReversed"
          :total-count="session.drawn.length"
          @undo="removeDrawn"
          @clear="clearHistory"
        />
      </div>
    </div>

    <RandomConfigDialog
      :open="configOpen"
      :config="config"
      @close="closeConfig"
      @update:bg-color="setBgColor"
      @update:text-color="setTextColor"
      @update:font-size-pc="setFontSizePc"
      @update:text-transform="setTextTransform"
      @update:animation-speed="setAnimationSpeed"
      @reset="resetDisplayToDefault"
    />

    <RandomProjectFab
      :projecting="isProjecting"
      @project="onToggleProjection"
      @clear="() => void clearProjection()"
    />
  </section>
</template>

<style scoped lang="scss">
.random-view {
  display: flex;
  box-sizing: border-box;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  height: calc(
    (100 * var(--ui-vh)) - var(--ds-header-height, 5.5rem) - var(--ds-dock-height, 5.5rem)
  );
  max-height: calc(
    (100 * var(--ui-vh)) - var(--ds-header-height, 5.5rem) - var(--ds-dock-height, 5.5rem)
  );
  min-height: 0;
  max-width: 100%;
  padding: 0.75rem var(--ds-spacing-page, 2rem) 0.5rem;
  overflow: hidden;

  @media (max-width: 960px) {
    height: auto;
    max-height: none;
    overflow: visible;
    padding-bottom: calc(var(--ds-dock-height, 5.5rem) + 5rem);
  }

  @media (max-width: 600px) {
    padding: 0.5rem 0.5rem 0;
    padding-bottom: calc(var(--ds-dock-height, 5.5rem) + 5rem);
  }
}

.random-view__header {
  display: flex;
  width: 100%;
  max-width: 80rem;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  @media (max-width: 600px) {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
}

.random-view__back {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ds-color-on-surface) 8%, transparent);
  color: var(--ds-color-on-surface);
  cursor: pointer;
  transition: background-color 160ms ease;

  &:hover {
    background: color-mix(in srgb, var(--ds-color-on-surface) 14%, transparent);
  }

  .ti {
    font-size: 1.15rem;
  }
}

.random-view__brand {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 0.65rem;

  @media (max-width: 960px) {
    flex-wrap: wrap;
  }
}

.random-view__brand-icon {
  display: flex;
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-md, 0.75rem);
  background: color-mix(in srgb, var(--ds-color-primary) 16%, transparent);
  color: var(--ds-color-primary);

  .ti {
    font-size: 1.2rem;
  }
}

.random-view__title {
  margin: 0;
  color: var(--ds-color-on-surface);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1;

  @media (max-width: 600px) {
    font-size: 1.1rem;
  }
}

.random-view__modes {
  display: inline-flex;
  margin-left: 0.35rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ds-color-on-surface) 10%, transparent);
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--ds-color-on-surface) 4%, transparent);

  @media (max-width: 960px) {
    margin-left: 0;
  }
}

.random-view__mode {
  height: 1.9rem;
  padding: 0 0.75rem;
  border: 0;
  background: transparent;
  color: var(--ds-color-on-surface-variant);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 700;

  &--active {
    background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
    color: var(--ds-color-primary);
  }
}

.random-view__reset {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.75rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-error, #ffb4ab) 30%, transparent);
  border-radius: var(--ds-radius-md, 0.5rem);
  background: color-mix(in srgb, var(--ds-color-error, #ffb4ab) 14%, transparent);
  color: var(--ds-color-error, #ffb4ab);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;

  .ti {
    font-size: 0.95rem;
  }
}

.random-view__content {
  position: relative;
  display: grid;
  width: 100%;
  max-width: 80rem;
  flex: 1 1 auto;
  grid-template-columns: minmax(14rem, 17rem) minmax(0, 1fr) minmax(14rem, 17rem);
  align-items: stretch;
  gap: 1rem;
  min-height: 0;
  overflow: visible;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(13rem, 15.5rem) minmax(0, 1fr) minmax(13rem, 15.5rem);
    gap: 0.75rem;
  }
}

.random-view__panel {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  min-height: 0;

  &--available,
  &--history {
    transform: none;
  }

  :deep(.random-available),
  :deep(.random-history) {
    width: 100%;
    height: 100%;
    max-height: none;
  }
}

.random-view__stage {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow: visible;
}

/* Tablet / estreito: empilha (stage no topo), densidade maior */
@media (max-width: 960px) {
  .random-view__content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .random-view__stage {
    order: -1;
  }

  .random-view__panel {
    :deep(.random-available),
    :deep(.random-history) {
      max-height: min(42vh, 22rem);
    }
  }
}

@media (max-width: 600px) {
  .random-view__content {
    gap: 0.5rem;
  }

  .random-view__panel {
    :deep(.random-available),
    :deep(.random-history) {
      max-height: min(48vh, 20rem);
    }
  }
}
</style>