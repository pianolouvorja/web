<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'
import { useMobileRouteGuard } from '@shared/composables/useMobileRouteGuard'

const props = defineProps<{
  modelValue: boolean
  routeKey: string
  desktopRedirectRoute?: string
  customTitle?: string
  customDescription?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const {
  shouldShowWarning,
  dismissWarning,
  goToDesktop,
} = useMobileRouteGuard({
  routeKey: props.routeKey,
  desktopRedirectRoute: props.desktopRedirectRoute,
  customTitle: props.customTitle,
  customDescription: props.customDescription,
})

const showDialog = computed({
  get: () => props.modelValue && shouldShowWarning.value,
  set: (val) => {
    if (!val) {
      dismissWarning()
    }
    emit('update:modelValue', val)
  },
})

const title = computed(() =>
  props.customTitle || t('settings.projection.mobile.desktopOnly.title')
)

const description = computed(() =>
  props.customDescription || t('settings.projection.mobile.desktopOnly.description')
)

const actionLabel = computed(() =>
  t('settings.projection.mobile.desktopOnly.actionLabel')
)

const dismissLabel = computed(() =>
  t('settings.projection.mobile.desktopOnly.dismiss')
)

const hint = computed(() =>
  t('settings.projection.mobile.desktopOnly.hint')
)

function onDismiss() {
  dismissWarning()
  emit('update:modelValue', false)
}

function onGoToDesktop() {
  goToDesktop()
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showDialog"
      class="mobile-route-warning-overlay"
      @click="onDismiss"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-warning-title"
      aria-describedby="mobile-warning-desc"
    >
      <GlassCard
        class="mobile-route-warning"
        @click.stop
        elevated
        :padding="false"
      >
        <div class="mobile-route-warning__icon" aria-hidden="true">
          <i class="ti ti-device-desktop" />
        </div>

        <h2
          id="mobile-warning-title"
          class="mobile-route-warning__title"
        >
          {{ title }}
        </h2>

        <p
          id="mobile-warning-desc"
          class="mobile-route-warning__description"
        >
          {{ description }}
        </p>

        <div class="mobile-route-warning__actions">
          <button
            type="button"
            class="mobile-route-warning__btn mobile-route-warning__btn--primary"
            @click="onGoToDesktop"
          >
            <i class="ti ti-device-desktop" aria-hidden="true" />
            {{ actionLabel }}
          </button>

          <button
            type="button"
            class="mobile-route-warning__btn mobile-route-warning__btn--secondary"
            @click="onDismiss"
          >
            {{ dismissLabel }}
          </button>
        </div>

        <p class="mobile-route-warning__hint">
          <i class="ti ti-lightbulb" aria-hidden="true" />
          {{ hint }}
        </p>
      </GlassCard>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.mobile-route-warning-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-spacing-4, 1rem);
  background: color-mix(in srgb, var(--ds-color-surface) 85%, transparent);
  backdrop-filter: blur(4px);
  animation: fade-in 200ms ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-route-warning {
  max-width: 28rem;
  width: 100%;
  animation: slide-up 300ms ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(1rem) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.mobile-route-warning__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin: 1.5rem auto 0.75rem;
  border-radius: var(--ds-radius-full);
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
  font-size: 2rem;
}

.mobile-route-warning__title {
  margin: 0 0 0.75rem;
  text-align: center;
  color: var(--ds-color-on-surface);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

.mobile-route-warning__description {
  margin: 0 0 1.5rem;
  text-align: center;
  color: var(--ds-color-on-surface-variant);
  font-size: 0.95rem;
  line-height: 1.6;
}

.mobile-route-warning__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0 1.5rem;

  @media (min-width: 480px) {
    flex-direction: row;
  }
}

.mobile-route-warning__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 0;
  border-radius: var(--ds-radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    transform 120ms ease,
    box-shadow 160ms ease;

  .ti {
    font-size: 1.1rem;
  }

  &:active {
    transform: scale(0.98);
  }
}

.mobile-route-warning__btn--primary {
  background: var(--ds-color-primary);
  color: var(--ds-color-on-primary);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--ds-color-primary) 35%, transparent);

  &:hover {
    background: color-mix(in srgb, var(--ds-color-primary) 90%, var(--ds-color-surface));
  }
}

.mobile-route-warning__btn--secondary {
  background: color-mix(in srgb, var(--ds-color-surface-container-high) 80%, transparent);
  color: var(--ds-color-on-surface);
  border: 1px solid var(--ds-color-outline);

  &:hover {
    background: color-mix(in srgb, var(--ds-color-surface-container-high) 95%, transparent);
  }
}

.mobile-route-warning__hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1.5rem 1.5rem;
  color: var(--ds-color-on-surface-variant);
  font-size: 0.8rem;
  line-height: 1.5;
  opacity: 0.85;

  .ti {
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: var(--ds-color-tertiary, #ffb77b);
    font-size: 0.9rem;
  }
}
</style>