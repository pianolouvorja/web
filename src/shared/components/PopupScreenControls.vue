<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PopupCountSelector from '@shared/components/PopupCountSelector.vue'
import {
  closeAllPopups,
  hasLivePopups,
} from '@shared/services/popup-windows'

const emit = defineEmits<{
  changed: []
}>()

const { t } = useI18n()

const hasPopups = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

function refresh() {
  hasPopups.value = hasLivePopups()
}

async function onCloseAll() {
  await closeAllPopups()
  refresh()
  emit('changed')
}

onMounted(() => {
  refresh()
  pollTimer = setInterval(refresh, 400)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="popup-screen-controls">
    <button
      v-if="hasPopups"
      type="button"
      class="popup-screen-controls__btn"
      :aria-label="t('popupControls.closeAll')"
      :title="t('popupControls.closeAll')"
      @click="onCloseAll"
    >
      <i
        class="ti ti-square-x"
        aria-hidden="true"
      />
    </button>

    <PopupCountSelector @change="emit('changed')" />
  </div>
</template>

<style scoped lang="scss">
.popup-screen-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  @media (max-width: 600px) {
    display: none;
  }
}

.popup-screen-controls__btn {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  color: var(--ds-color-primary);
  cursor: pointer;
  transition:
    transform 160ms ease,
    background-color 160ms ease;

  &:hover {
    transform: scale(1.06);
    background: color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  }

  .ti {
    font-size: 1.1rem;
    line-height: 1;
  }
}
</style>
