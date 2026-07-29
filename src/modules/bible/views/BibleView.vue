<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import BibleNavPanel from '../components/BibleNavPanel.vue'
import BibleProjectFab from '../components/BibleProjectFab.vue'
import BibleToolbar from '../components/BibleToolbar.vue'
import BibleVerseList from '../components/BibleVerseList.vue'
import { useBibleReader } from '../composables/useBibleReader'
import { useBibleNavCollapse } from '../composables/useBibleNavCollapse'

const { t } = useI18n()

const {
  versions,
  selectedVersionId,
  selectedBookId,
  selectedChapter,
  selectedVerses,
  testamentFilter,
  showNavPanel,
  bookSearchQuery,
  chapterSearchQuery,
  verseSearchQuery,
  globalSearchQuery,
  isLoadingMeta,
  isLoadingVerses,
  lastErrorKey,
  isProjecting,
  projection,
  filteredBooks,
  chapterNumbers,
  locationLabel,
  chapterTitle,
  verseEntries,
  hasProjection,
  previewSnippet,
  clearError,
  selectVersion,
  selectBook,
  selectChapter,
  selectVerse,
  clearSelection,
  goToAdjacentVerse,
  setTestamentFilter,
  toggleNavPanel,
  toggleProjection,
  clearProjectionWindow,
  refreshProjectionState,
  refresh,
} = useBibleReader()

function onProject() {
  void toggleProjection()
}

function onClearProjection() {
  void clearProjectionWindow()
}

function onScreenControlsChanged() {
  refreshProjectionState()
}

function onPreviousVerse() {
  void goToAdjacentVerse(-1)
}

function onNextVerse() {
  void goToAdjacentVerse(1)
}

// ═══ SCROLL CONTROL: mobile ═══
const { isMobile, booksCollapsed, chaptersCollapsed } = useBibleNavCollapse()
const navAllCollapsed = computed(() => isMobile.value && booksCollapsed.value && chaptersCollapsed.value)
</script>

<template>
  <section class="bible-view">
    <BibleToolbar
      :versions="versions"
      :selected-version-id="selectedVersionId"
      :location-label="locationLabel"
      :show-nav-panel="showNavPanel"
      :bible-search-query="globalSearchQuery"
      :versions-disabled="isLoadingMeta"
      @select-version="selectVersion"
      @toggle-nav="toggleNavPanel"
      @update:bible-search-query="globalSearchQuery = $event"
    />

    <div
      v-if="lastErrorKey"
      class="bible-view__alert"
      role="alert"
    >
      <p>{{ t(lastErrorKey) }}</p>
      <div class="bible-view__alert-actions">
        <button
          type="button"
          class="bible-view__alert-btn"
          @click="refresh"
        >
          {{ t('bible.retry') }}
        </button>
        <button
          type="button"
          class="bible-view__alert-btn bible-view__alert-btn--ghost"
          @click="clearError"
        >
          {{ t('bible.dismiss') }}
        </button>
      </div>
    </div>

    <div
      v-else-if="isLoadingMeta"
      class="bible-view__state"
    >
      {{ t('bible.loading') }}
    </div>

    <div
      v-else-if="filteredBooks.length === 0 && versions.length === 0"
      class="bible-view__state"
    >
      {{ t('bible.emptyCatalog') }}
    </div>

    <div
      v-else
      class="bible-view__body"
      :class="{
        'bible-view__body--reader-only': !showNavPanel,
        'bible-view__body--nav-collapsed': navAllCollapsed,
      }"
    >
      <BibleNavPanel
        v-if="showNavPanel"
        class="bible-view__nav"
        :books="filteredBooks"
        :selected-book-id="selectedBookId"
        :testament="testamentFilter"
        :book-search-query="bookSearchQuery"
        :chapters="chapterNumbers"
        :selected-chapter="selectedChapter"
        :chapter-search-query="chapterSearchQuery"
        @update:book-search-query="bookSearchQuery = $event"
        @update:chapter-search-query="chapterSearchQuery = $event"
        @update:testament="setTestamentFilter"
        @select-book="selectBook"
        @select-chapter="selectChapter"
      />

      <BibleVerseList
        v-if="selectedBookId !== null && selectedChapter !== null"
        class="bible-view__reader"
        :chapter-title="chapterTitle"
        :verses="verseEntries"
        :selected-verses="selectedVerses"
        :verse-search-query="verseSearchQuery"
        :is-loading="isLoadingVerses"
        :projection="projection"
        :preview-snippet="previewSnippet"
        :has-projection="hasProjection"
        @update:verse-search-query="verseSearchQuery = $event"
        @select-verse="selectVerse"
        @previous-verse="onPreviousVerse"
        @next-verse="onNextVerse"
        @clear-projection="clearSelection"
        @screen-controls-changed="onScreenControlsChanged"
      />
      <div
        v-else-if="selectedBookId !== null"
        class="bible-view__reader bible-view__placeholder"
      >
        {{ t('bible.selectChapterPrompt') }}
      </div>
      <div
        v-else
        class="bible-view__reader bible-view__placeholder"
      >
        {{ t('bible.selectBookAndChapter') }}
      </div>
    </div>

    <BibleProjectFab
      :disabled="!hasProjection"
      :projecting="isProjecting"
      @project="onProject"
      @clear="onClearProjection"
    />
  </section>
</template>

<style scoped lang="scss">
.bible-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.75rem var(--ds-spacing-page, 2rem) 0;

  @media (max-width: 600px) {
    gap: 0.5rem;
    padding: 0.5rem 0.5rem 0;
  }
}

.bible-view__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  flex: 1 1 auto;
  min-height: 0;

  &--reader-only {
    grid-template-columns: minmax(0, 1fr);
  }

  // Mobile (≤1280px): layout em coluna.
  // Quando nav-panel aberto: tudo flui naturalmente (auto auto), barra do browser rola.
  // Quando nav colapsado: reader ocupa resto da tela com scroll proprio.
  @media (max-width: 1280px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;

    // Nav colapsado: header compacto + reader com altura fixa e scroll interno.
    // Altura = viewport - header app - toolbar bible - paddings - dock.
    &--nav-collapsed {
      grid-template-rows: auto minmax(0, 1fr);
      height: calc(100vh - 3.5rem - 5rem - var(--ds-dock-height, 4.5rem));
      overflow: hidden;

      @media (max-width: 600px) {
        height: calc(100vh - 3.5rem - 4rem - var(--ds-dock-height, 4.5rem));
      }
    }
  }

  @media (max-width: 600px) {
    gap: 0.5rem;
  }
}

.bible-view__nav {
  min-height: 0;

  @media (max-width: 1280px) {
    flex-shrink: 0;
  }

  // Mobile: o nav-panel colapsavel precisa se expandir sem ser cortado
  @media (max-width: 768px) {
    overflow: visible;
  }
}

.bible-view__reader {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bible-view :deep(.bible-toolbar) {
  flex-shrink: 0;
}

.bible-view__state,
.bible-view__alert {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: var(--ds-radius-lg, 1rem 0 1rem 0);
  background: color-mix(in srgb, var(--ds-color-surface-card) 72%, transparent);
  border: 1px solid var(--ds-color-outline-strong);
  padding: 1.5rem;
  color: var(--ds-color-on-surface-variant);
}

.bible-view__alert {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  p {
    margin: 0;
    color: var(--ds-color-on-surface);
  }
}

.bible-view__alert-actions {
  display: flex;
  gap: 0.5rem;
}

.bible-view__alert-btn {
  border: 0;
  border-radius: var(--ds-radius-md, 0.5rem 0 0.5rem 0);
  background: color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  color: var(--ds-color-primary-soft);
  padding: 0.4rem 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &--ghost {
    background: transparent;
    border: 1px solid var(--ds-color-outline);
  }
}

.bible-view__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--ds-color-on-surface-variant, rgba(255, 255, 255, 0.6));
  font-size: 0.95rem;
  padding: 2rem;
}
</style>

<style lang="scss">
[data-mode='light'] .bible-view .ds-glass-card {
  background: color-mix(in srgb, #ffffff 82%, transparent);
  border-color: #e8ecf3;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.03);
}

[data-mode='light'] .bible-view .ds-glass-card:hover {
  background: color-mix(in srgb, #ffffff 90%, transparent);
}

[data-mode='light'] .bible-view__state,
[data-mode='light'] .bible-view__alert {
  background: color-mix(in srgb, #ffffff 82%, transparent);
  border-color: #e8ecf3;
}
</style>
