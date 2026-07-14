<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  getPopupCount,
  PROJECTION_DEFAULTS,
  setPopupCount,
} from '@shared/services/projection-preferences'
import {
  hasLivePopups,
  syncPopupWindows,
} from '@shared/services/popup-windows'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const { t } = useI18n()

const rootRef = useTemplateRef<HTMLElement>('root')
const menuOpen = ref(false)
const popupCount = ref(getPopupCount())
const countOptions = Array.from(
  { length: PROJECTION_DEFAULTS.popupCountMax },
  (_, index) => index + 1,
)

let syncTimer: ReturnType<typeof setInterval> | null = null

function refreshCount() {
  popupCount.value = getPopupCount()
}

function selectCount(value: number) {
  popupCount.value = setPopupCount(value)
  menuOpen.value = false
  if (hasLivePopups()) {
    syncPopupWindows()
  }
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null
  if (rootRef.value && target && !rootRef.value.contains(target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  refreshCount()
  document.addEventListener('click', onDocumentClick)
  syncTimer = setInterval(refreshCount, 800)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  if (syncTimer) clearInterval(syncTimer)
})
</script>

<template>
  <div
    ref="root"
    class="popup-count-selector"
  >
    <span class="popup-count-selector__label">
      {{ t('popupCount.label') }}
    </span>
    <button
      type="button"
      class="popup-count-selector__btn"
      :class="{ 'popup-count-selector__btn--compact': compact }"
      :aria-label="t('popupCount.tooltip')"
      :title="t('popupCount.tooltip')"
      :aria-expanded="menuOpen"
      aria-haspopup="listbox"
      @click.stop="menuOpen = !menuOpen"
    >
      {{ popupCount }}
    </button>

    <div
      v-if="menuOpen"
      class="popup-count-selector__menu"
      role="listbox"
      :aria-label="t('popupCount.tooltip')"
    >
      <button
        v-for="n in countOptions"
        :key="n"
        type="button"
        class="popup-count-selector__option"
        :class="{ 'popup-count-selector__option--active': popupCount === n }"
        role="option"
        :aria-selected="popupCount === n"
        @click.stop="selectCount(n)"
      >
        {{ n }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.popup-count-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.popup-count-selector__label {
  display: inline-flex;
  align-items: center;
  height: 1.5rem;
  padding: 0 0.55rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  user-select: none;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}

.popup-count-selector__btn {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--ds-radius-md, 0.75rem);
  background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  color: var(--ds-color-primary);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
  transition:
    transform 160ms ease,
    background-color 160ms ease;

  &:hover {
    transform: scale(1.06);
    background: color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  }

  &--compact {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }
}

.popup-count-selector__menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 20;
  display: flex;
  min-width: 3rem;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-on-surface) 10%, transparent);
  border-radius: var(--ds-radius-md, 0.75rem);
  background: color-mix(in srgb, var(--ds-color-surface, #1c1b1f) 92%, transparent);
  box-shadow: 0 12px 32px rgb(0 0 0 / 35%);
  backdrop-filter: blur(12px);
}

.popup-count-selector__option {
  display: flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--ds-radius-sm, 0.5rem);
  background: transparent;
  color: var(--ds-color-on-surface);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;

  &:hover {
    background: color-mix(in srgb, var(--ds-color-primary) 14%, transparent);
  }

  &--active {
    background: color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
    color: var(--ds-color-primary);
  }
}
</style>
