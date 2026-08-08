<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'
import { VBtn } from 'vuetify/components'

import { useEula } from '@shared/composables/useEula'

const { t } = useI18n()
const { accept, decline, currentVersion } = useEula()

const showFullText = ref(false)

function onAccept() {
  accept()
}

function onDecline() {
  decline()
}
</script>

<template>
  <div class="eula-dialog" role="dialog" aria-modal="true" aria-labelledby="eula-title">
    <GlassCard class="eula-dialog__card" elevated>
      <div class="eula-dialog__icon" aria-hidden="true">
        <i class="ti ti-license" />
      </div>

      <h2 id="eula-title" class="eula-dialog__title">
        {{ t('eula.title') }}
      </h2>

      <p class="eula-dialog__intro">
        {{ t('eula.intro') }}
      </p>

      <details v-if="showFullText" class="eula-dialog__full-text" open>
        <summary class="eula-dialog__full-text-summary">
          {{ t('eula.viewFull') }}
        </summary>
        <div class="eula-dialog__full-text-body">
          <slot name="full-text">
            <p>
              Este software é fornecido "no estado em que se encontra", sem garantias de qualquer tipo.
              Ao utilizar o LouvorJA - PIANO, você concorda com os termos da licença de uso.
              O uso comercial sem autorização expressa é proibido.
              Para consultar o EULA completo, consulte o arquivo em docs/LEGAL/EULA.md.
            </p>
          </slot>
        </div>
      </details>

      <button
        v-else
        class="eula-dialog__view-link"
        type="button"
        @click="showFullText = true"
      >
        {{ t('eula.viewFull') }}
      </button>

      <p class="eula-dialog__version">
        {{ t('eula.version') }} {{ currentVersion }}
      </p>

      <div class="eula-dialog__actions">
        <VBtn
          variant="outlined"
          size="large"
          class="eula-dialog__btn-decline"
          @click="onDecline"
        >
          {{ t('eula.decline') }}
        </VBtn>

        <VBtn
          variant="tonal"
          size="large"
          class="eula-dialog__btn-accept"
          @click="onAccept"
        >
          {{ t('eula.accept') }}
        </VBtn>
      </div>
    </GlassCard>
  </div>
</template>

<style scoped lang="scss">
.eula-dialog {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-spacing-4, 1rem);
  background: color-mix(in srgb, var(--ds-color-surface) 95%, transparent);
  backdrop-filter: blur(4px);
  z-index: 2000;
  animation: eulaFadeIn 200ms ease;

  @keyframes eulaFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

.eula-dialog__card {
  width: 100%;
  max-width: 28rem;
  padding: 2.5rem 2rem;
  text-align: center;
  border-radius: var(--ds-radius-xl, 1.5rem);
  max-height: 90vh;
  overflow-y: auto;
}

.eula-dialog__icon {
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

.eula-dialog__title {
  margin: 0 0 1rem;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--ds-color-on-surface);
  line-height: 1.3;
}

.eula-dialog__intro {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  color: var(--ds-color-on-surface-variant);
  line-height: 1.6;
}

.eula-dialog__view-link {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0;
  border: none;
  background: none;
  font-size: 0.875rem;
  color: var(--ds-color-primary);
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;

  &:hover {
    opacity: 0.8;
  }
}

.eula-dialog__full-text {
  margin-bottom: 1.5rem;
  text-align: left;
}

.eula-dialog__full-text-summary {
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--ds-color-primary);
  margin-bottom: 0.75rem;
}

.eula-dialog__full-text-body {
  padding: 1rem;
  background: color-mix(in srgb, var(--ds-color-surface-variant) 30%, transparent);
  border-radius: var(--ds-radius-md, 0.75rem);
  font-size: 0.875rem;
  color: var(--ds-color-on-surface-variant);
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

.eula-dialog__version {
  margin: 0 0 1.5rem;
  font-size: 0.75rem;
  color: var(--ds-color-on-surface-variant);
  opacity: 0.6;
}

.eula-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 480px) {
    flex-direction: row;
    justify-content: center;
  }
}

.eula-dialog__btn-decline,
.eula-dialog__btn-accept {
  flex: 1;
  min-width: 0;
}
</style>

<style lang="scss">
[data-mode='light'] .eula-dialog {
  background: color-mix(in srgb, #ffffff 95%, transparent);
}
</style>
