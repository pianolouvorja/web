<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  getPopupCount,
  getTargetPopupSlots,
  toggleTargetPopupSlot,
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

const emit = defineEmits<{
  change: [slots: number[]]
}>()

const { t } = useI18n()

const rootRef = useTemplateRef<HTMLElement>('root')
const btnRef = useTemplateRef<HTMLElement>('btn')
const menuRef = useTemplateRef<HTMLElement>('menu')
const menuOpen = ref(false)
const availableCount = ref(getPopupCount())
const selectedSlots = ref<number[]>(getTargetPopupSlots())
const menuStyle = ref<Record<string, string>>({})

let syncTimer: ReturnType<typeof setInterval> | null = null

const optionsList = computed(() =>
  Array.from({ length: availableCount.value }, (_, index) => {
    const id = index + 1
    return {
      id,
      label: t('monitors.screenLabel', { index: id }),
      isSelected: selectedSlots.value.includes(id),
    }
  }),
)

const selectedCount = computed(() => selectedSlots.value.length)

const triggerLabel = computed(() => {
  if (selectedCount.value > 0) {
    return t('monitors.selectedCount', { count: selectedCount.value })
  }
  return t('monitors.selectScreens')
})

function refresh() {
  availableCount.value = getPopupCount()
  selectedSlots.value = getTargetPopupSlots()
}

function updateMenuPosition() {
  const trigger = btnRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const menuWidth = Math.min(296, Math.max(220, window.innerWidth - 16))
  const left = Math.min(
    Math.max(8, rect.right - menuWidth),
    window.innerWidth - menuWidth - 8,
  )
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < 280 && rect.top > spaceBelow

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

function onToggle(slot: number) {
  selectedSlots.value = toggleTargetPopupSlot(slot)
  emit('change', selectedSlots.value)
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
  refresh()
  await nextTick()
  updateMenuPosition()
})

onMounted(() => {
  refresh()
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
  syncTimer = setInterval(refresh, 800)
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
    <span
      v-if="!compact"
      class="popup-count-selector__label"
    >
      {{ t('popupCount.label') }}
    </span>
    <button
      ref="btn"
      type="button"
      class="popup-count-selector__btn"
      :class="{ 'popup-count-selector__btn--compact': compact }"
      :aria-label="triggerLabel"
      :title="triggerLabel"
      :aria-expanded="menuOpen"
      aria-haspopup="dialog"
      @click.stop="toggleMenu"
    >
      <i
        class="ti ti-devices"
        aria-hidden="true"
      />
      <span
        v-if="selectedCount > 0"
        class="popup-count-selector__badge"
      >
        {{ selectedCount }}
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="menuOpen"
        ref="menu"
        class="popup-count-selector__menu"
        role="dialog"
        :aria-label="t('monitors.selectScreens')"
        :style="menuStyle"
        @click.stop
      >
        <p class="popup-count-selector__title">
          {{ t('monitors.selectScreens') }}
        </p>
        <p class="popup-count-selector__hint">
          {{ t('monitors.hint') }}
        </p>

        <ul 
          class="popup-count-selector__list"
          role="group"
          :aria-label="t('monitors.selectScreens')"
        >
          <li
            v-for="screen in optionsList"
            :key="screen.id"
          >
            <label
              class="popup-count-selector__option"
              :class="{ 'popup-count-selector__option--active': screen.isSelected }"
            >
              <input
                type="checkbox"
                class="popup-count-selector__checkbox"
                :checked="screen.isSelected"
                @change="onToggle(screen.id)"
              >
              <span class="popup-count-selector__option-name">
                {{ screen.label }}
              </span>
            </label>
          </li>
        </ul>
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
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: 0 0.45rem;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border: 0;
  border-radius: var(--ds-radius-md, 0.75rem);
  background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  color: var(--ds-color-primary);
  cursor: pointer;
  overflow: visible;
  transition:
    transform 160ms ease,
    background-color 160ms ease;

  &:hover {
    transform: scale(1.06);
    background: color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  }

  .ti {
    font-size: 1.05rem;
    line-height: 1;
  }

  &--compact {
    min-width: 2rem;
    min-height: 2rem;
    padding: 0 0.35rem;

    .ti {
      font-size: 0.95rem;
    }
  }
}

.popup-count-selector__badge {
  display: inline-flex;
  min-width: 1.15rem;
  height: 1.15rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--ds-color-primary);
  color: var(--ds-color-on-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
}

.popup-count-selector__menu {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-on-surface) 10%, transparent);
  border-radius: var(--ds-radius-md, 0.75rem);
  background: color-mix(in srgb, var(--ds-color-surface, #1c1b1f) 94%, transparent);
  box-shadow: 0 12px 32px rgb(0 0 0 / 35%);
  backdrop-filter: blur(12px);
}

.popup-count-selector__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--ds-color-on-surface);
}

.popup-count-selector__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--ds-color-on-surface-variant);
}

.popup-count-selector__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.popup-count-selector__option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.35rem;
  padding: 0.35rem 0.55rem;
  border-radius: var(--ds-radius-sm, 0.5rem);
  cursor: pointer;
  color: var(--ds-color-on-surface);
  transition: background-color 140ms ease;

  &:hover {
    background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  }

  &--active {
    background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  }
}

.popup-count-selector__checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--ds-color-primary);
  cursor: pointer;
}

.popup-count-selector__option-name {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
