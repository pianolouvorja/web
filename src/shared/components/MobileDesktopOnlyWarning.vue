<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'
import { VBtn } from 'vuetify/components'

import {
  DESKTOP_ONLY_MESSAGE,
  type DesktopOnlyRouteName,
} from '@shared/composables/useMobileDetection'

const props = defineProps<{
  routeName: DesktopOnlyRouteName | null
  customMessage?: {
    title?: string
    description?: string
    actionLabel?: string
    actionHref?: string
  }
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const { t } = useI18n()

const message = computed(() => ({
  title: props.customMessage?.title ?? t('mobile.desktopOnly.title', DESKTOP_ONLY_MESSAGE.title),
  description: props.customMessage?.description ?? t('mobile.desktopOnly.description', DESKTOP_ONLY_MESSAGE.description),
  actionLabel: props.customMessage?.actionLabel ?? t('mobile.desktopOnly.actionLabel', DESKTOP_ONLY_MESSAGE.actionLabel),
  actionHref: props.customMessage?.actionHref ?? DESKTOP_ONLY_MESSAGE.actionHref,
}))

function onDismiss() {
  emit('dismiss')
}

function onActionClick() {
  // Em vez de navegar, apenas emite dismiss - o guard do router fará o redirect
  emit('dismiss')
}
</script>

<template>
  <div class="mobile-desktop-only" role="alertdialog" aria-labelledby="desktop-only-title" aria-describedby="desktop-only-desc">
    <GlassCard class="mobile-desktop-only__card" elevated>
      <div class="mobile-desktop-only__icon" aria-hidden="true">
        <i class="ti ti-device-desktop" />
      </div>

      <h2 id="desktop-only-title" class="mobile-desktop-only__title">
        {{ message.title }}
      </h2>

      <p id="desktop-only-desc" class="mobile-desktop-only__description">
        {{ message.description }}
      </p>

      <div class="mobile-desktop-only__actions">
        <VBtn
          variant="outlined"
          size="large"
          class="mobile-desktop-only__btn-dismiss"
          @click="onDismiss"
        >
          {{ t('mobile.desktopOnly.dismiss', 'Entendi, continuar mesmo assim') }}
        </VBtn>

        <VBtn
          variant="tonal"
          size="large"
          class="mobile-desktop-only__btn-action"
          @click="onActionClick"
        >
          {{ message.actionLabel }}
        </VBtn>
      </div>

      <p class="mobile-desktop-only__hint">
        {{ t('mobile.desktopOnly.hint', 'Dica: adicione este site à tela inicial para uma experiência similar a app nativo.') }}
      </p>
    </GlassCard>
  </div>
</template>

<style scoped lang="scss">
.mobile-desktop-only {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-spacing-4, 1rem);
  background: color-mix(in srgb, var(--ds-color-surface) 95%, transparent);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: fadeIn 200ms ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

.mobile-desktop-only__card {
  width: 100%;
  max-width: 24rem;
  padding: 2.5rem 2rem;
  text-align: center;
  border-radius: var(--ds-radius-xl, 1.5rem);
}

.mobile-desktop-only__icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);

  .ti {
    font-size: 2rem;
  }
}

.mobile-desktop-only__title {
  margin: 0 0 1rem;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--ds-color-on-surface);
  line-height: 1.3;
}

.mobile-desktop-only__description {
  margin: 0 0 2rem;
  font-size: 1rem;
  color: var(--ds-color-on-surface-variant);
  line-height: 1.6;
}

.mobile-desktop-only__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  @media (min-width: 480px) {
    flex-direction: row;
    justify-content: center;
  }
}

.mobile-desktop-only__btn-dismiss,
.mobile-desktop-only__btn-action {
  flex: 1;
  min-width: 0;
}

.mobile-desktop-only__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ds-color-on-surface-variant);
  opacity: 0.7;
  line-height: 1.5;
}
</style>

<style lang="scss">
[data-mode='light'] .mobile-desktop-only {
  background: color-mix(in srgb, #ffffff 95%, transparent);
}
</style>