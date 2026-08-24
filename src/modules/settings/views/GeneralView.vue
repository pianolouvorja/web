<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'
import { USER_PREFERENCE_KEYS } from '@shared/constants/storage-keys'
import { getUserPreference, setUserPreference } from '@shared/services/user-preferences'

const { t, locale } = useI18n()

// EN/ES ocultos por hora — tradução incompleta; reabilitar quando
// o paridade de chaves estiver 100% (ver spec 2026-08-24-paridade-app-web).
const locales = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  // { value: 'en', label: 'English' },
  // { value: 'es', label: 'Español' },
] as const

const currentLanguage = ref(
  getUserPreference<string>(USER_PREFERENCE_KEYS.language, 'pt-BR') ?? 'pt-BR',
)

function changeLanguage(value: typeof locales[number]['value']) {
  currentLanguage.value = value
  locale.value = value
  setUserPreference(USER_PREFERENCE_KEYS.language, value)
}
</script>

<template>
  <section class="general-settings">
    <GlassCard class="general-settings__card" elevated>
      <div class="general-settings__heading">
        <i class="ti ti-world" aria-hidden="true" />
        <h2>{{ t('settings.general.languageTitle') }}</h2>
      </div>
      <p>{{ t('settings.general.languageHint') }}</p>
      <div class="general-settings__languages">
        <button
          v-for="item in locales"
          :key="item.value"
          type="button"
          :class="{ 'general-settings__language--active': currentLanguage === item.value }"
          class="general-settings__language"
          @click="changeLanguage(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </GlassCard>
  </section>
</template>

<style scoped lang="scss">
.general-settings { max-width: 48rem; }
.general-settings__card { display: grid; gap: 1rem; }
.general-settings__heading { display: flex; gap: .75rem; align-items: center; }
.general-settings__heading h2, .general-settings__card p { margin: 0; }
.general-settings__heading .ti { color: var(--ds-color-primary); font-size: 1.5rem; }
.general-settings__languages { display: flex; flex-wrap: wrap; gap: .75rem; }
.general-settings__language { padding: .65rem 1rem; border: 1px solid var(--ds-color-outline); border-radius: 10px; background: transparent; color: inherit; cursor: pointer; }
.general-settings__language--active { border-color: var(--ds-color-primary); color: var(--ds-color-primary); font-weight: 700; }
</style>
