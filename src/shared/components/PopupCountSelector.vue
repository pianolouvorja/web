<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
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
const btnRef = useTemplateRef<HTMLElement>('btn')
const menuRef = useTemplateRef<HTMLElement>('menu')
const menuOpen = ref(false)
const popupCount = ref(getPopupCount())
const menuStyle = ref<Record<string, string>>({})
const countOptions = Array.from(
  { length: PROJECTION_DEFAULTS.popupCountMax },
  (_, index) => index + 1,
)

let syncTimer: ReturnType<typeof setInterval> | null = null

function refreshCount() {
  popupCount.value = getPopupCount()
}

function updateMenuPosition() {
  const trigger = btnRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const menuWidth = Math.max(48, rect.width)
  const left = Math.min(
    Math.max(8, rect.right - menuWidth),
    window.innerWidth - menuWidth - 8,
  )
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < 220 && rect.top > spaceBelow

  menuStyle.value = {
    position: 'fixed',
    width: `${menuWidth}px`,
    left: `${left}px`,
    zIndex: '80',
    ...(openUp
      ? { bottom: `${window.innerHeight - rect.top + 8}px`, top: 'auto' }
      : { top: `${rect.bottom + 8}px`, bottom: 'auto' }),
  }
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function selectCount(value: number) {
  popupCount.value = setPopupCount(value)
  menuOpen.value = false
  if (hasLivePopups()) {
    syncPopupWindows()
  }
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (rootRef.value?.contains(target)) return
  if (menuRef.value?.contains(target)) return
  menuOpen.value = false
}

function onWindowChange() {
  if (!menuOpen.value) return
  updateMenuPosition()
}

watch(menuOpen, async (open) => {
  if (!open) return
  await nextTick()
  updateMenuPosition()
})

onMounted(() => {
  refreshCount()
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
  syncTimer = setInterval(refreshCount, 800)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
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
      ref="btn"
      type="button"
      class="popup-count-selector__btn"
      :class="{ 'popup-count-selector__btn--compact': compact }"
      :aria-label="t('popupCount.tooltip')"
      :title="t('popupCount.tooltip')"
      :aria-expanded="menuOpen"
      aria-haspopup="listbox"
      @click.stop="toggleMenu"
    >
      {{ popupCount }}
    </button>

    <Teleport to="body">
      <div
        v-if="menuOpen"
        ref="menu"
        class="popup-count-selector__menu"
        role="listbox"
        :aria-label="t('popupCount.tooltip')"
        :style="menuStyle"
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
    </Teleport>
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
  box-sizing: border-box;
  min-height: 2rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  user-select: none;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}

.popup-count-selector__btn {
  display: inline-flex;
  box-sizing: border-box;
  width: 2.25rem;
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: 0;
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
  overflow: visible;
  transition:
    transform 160ms ease,
    background-color 160ms ease;

  &:hover {
    transform: scale(1.06);
    background: color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  }

  &--compact {
    width: 2rem;
    min-width: 2rem;
    min-height: 2rem;
    font-size: 0.8125rem;
  }
}

.popup-count-selector__menu {
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
