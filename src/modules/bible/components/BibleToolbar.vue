<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import BibleVersionSelect from './BibleVersionSelect.vue'
import type { BibleVersion } from '../types/bible'

const props = defineProps<{
  versions: BibleVersion[]
  selectedVersionId: number | null
  locationLabel: string
  showNavPanel: boolean
  bibleSearchQuery: string
  versionsDisabled?: boolean
}>()

const emit = defineEmits<{
  selectVersion: [versionId: number]
  toggleNav: []
  'update:bibleSearchQuery': [value: string]
}>()

const { t } = useI18n()

/** false = versículos; true = livros e capítulos.
 *  O rótulo indica o destino do próximo clique. */
const browseLabel = computed(() =>
  props.showNavPanel
    ? t('bible.browseVerses')
    : t('bible.browseBooksAndChapters'),
)

const browseIcon = computed(() =>
  props.showNavPanel ? 'ti-list-numbers' : 'ti-book-2',
)
</script>

<template>
  <GlassCard
    class="bible-toolbar"
    elevated
  >
    <div class="bible-toolbar__meta">
      <BibleVersionSelect
        :versions="versions"
        :selected-version-id="selectedVersionId"
        :disabled="versionsDisabled"
        @select="emit('selectVersion', $event)"
      />

      <div
        class="bible-toolbar__divider"
        aria-hidden="true"
      />

      <div v-if="locationLabel" class="bible-toolbar__field">
        <span class="bible-toolbar__label">{{ t('bible.location') }}</span>
        <span class="bible-toolbar__location">
          {{ locationLabel || t('bible.locationEmpty') }}
        </span>
      </div>
    </div>

    <div class="bible-toolbar__actions">
      <div class="bible-toolbar__search">
        <i
          class="ti ti-search bible-toolbar__search-icon"
          aria-hidden="true"
        />
        <input
          class="bible-toolbar__search-input"
          type="search"
          :value="bibleSearchQuery"
          :placeholder="t('bible.searchBible')"
          :aria-label="t('bible.searchBible')"
          @input="emit('update:bibleSearchQuery', ($event.target as HTMLInputElement).value)"
        >
      </div>

      <button
        type="button"
        class="bible-toolbar__browse"
        :class="{ 'bible-toolbar__browse--books': showNavPanel }"
        :aria-pressed="showNavPanel"
        :aria-label="browseLabel"
        @click="emit('toggleNav')"
      >
        <i
          :class="['ti', browseIcon]"
          aria-hidden="true"
        />
        <span class="bible-toolbar__browse-label">{{ browseLabel }}</span>
      </button>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.bible-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem !important;
  overflow: visible;

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem !important;
    width: 100%;
    flex-wrap: nowrap;
  }

  @media (max-width: 600px) {
    flex-wrap: wrap !important;
    gap: 0.4rem !important;
  }
}

.bible-toolbar__meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-width: 0;
  flex: 1 1 auto;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  @media (max-width: 600px) {
    display: contents !important;
  }
}

.bible-toolbar__field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 0.35rem;
  }

  @media (max-width: 600px) {
    order: 3 !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
    justify-content: flex-end !important;
  }

  @media (max-width: 430px) {
    display: none !important;
  }
}

.bible-toolbar__label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-color-on-surface-variant);
  opacity: 0.75;

  @media (max-width: 768px) {
    display: none;
  }
}

.bible-toolbar__location {
  font-weight: 500;
  color: var(--ds-color-on-surface);

  @media (max-width: 768px) {
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.bible-toolbar__divider {
  width: 1px;
  height: 2rem;
  background: var(--ds-color-outline);
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
}

.bible-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  min-width: 0;

  @media (max-width: 768px) {
    width: auto;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    display: contents !important;
  }
}

.bible-toolbar__search {
  position: relative;
  width: 100%;
  max-width: calc((100% - 1.25rem) / 2);
  flex-shrink: 1;
  min-width: 0;

  @media (max-width: 768px) {
    max-width: 120px;
    flex: 0 1 auto;
  }

  @media (max-width: 600px) {
    order: 4 !important;
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
    margin-top: 0.25rem !important;
  }

  @media (max-width: 430px) {
    display: none !important;
  }
}

.bible-toolbar__search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ds-color-on-surface-variant);
  pointer-events: none;

  @media (max-width: 768px) {
    left: 0.6rem;
    font-size: 0.9rem;
  }
}

.bible-toolbar__search-input {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--ds-color-outline-strong) 80%, transparent);
  border-radius: 999px;
  background: var(--ds-color-surface-container);
  color: var(--ds-color-on-surface);
  padding: 0.55rem 1rem 0.55rem 2.5rem;
  font-size: 0.875rem;
  outline: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  @media (max-width: 768px) {
    padding: 0.4rem 0.6rem 0.4rem 2rem;
    font-size: 0.8rem;
  }

  &:focus {
    border-color: color-mix(in srgb, var(--ds-color-primary) 55%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ds-color-primary) 35%, transparent);
  }
}


.bible-toolbar__browse {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: var(--ds-radius-md, 0.5rem 0 0.5rem 0);
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 25%, transparent);
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary-soft);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 150ms ease;

  @media (max-width: 768px) {
    padding: 0.55rem 0.75rem;
    aspect-ratio: 1;
    justify-content: center;
  }

  @media (max-width: 600px) {
    order: 2 !important;
    flex: 0 0 auto !important;
  }

  &:hover {
    background: color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
  }

  &:active {
    transform: scale(0.98);
  }

  &--books {
    background: color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
    border-color: color-mix(in srgb, var(--ds-color-primary) 45%, transparent);
  }
}

.bible-toolbar__browse-label {
  @media (max-width: 768px) {
    display: none;
  }
}

:deep(.bible-version-select) {
  @media (max-width: 600px) {
    order: 1 !important;
    flex: 0 1 auto !important;
    min-width: 0 !important;
  }
}

</style>

<style lang="scss">
[data-mode='light'] .bible-toolbar__search-input {
  background: #f7f8fc;
  border-color: #e8ecf3;
}

[data-mode='light'] .bible-toolbar__search-input:focus {
  background: #fff;
}

[data-mode='light'] .bible-toolbar__browse {
  box-shadow: 0 1px 2px color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}
</style>
