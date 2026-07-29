<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import BibleBookGrid from './BibleBookGrid.vue'
import BibleChapterGrid from './BibleChapterGrid.vue'
import { useBibleNavCollapse } from '../composables/useBibleNavCollapse'
import type { BibleBook, BibleTestament } from '../types/bible'

const props = defineProps<{
  books: BibleBook[]
  selectedBookId: number | null
  testament: BibleTestament
  bookSearchQuery: string
  chapters: number[]
  selectedChapter: number | null
  chapterSearchQuery: string
}>()

const emit = defineEmits<{
  'update:bookSearchQuery': [value: string]
  'update:chapterSearchQuery': [value: string]
  'update:testament': [value: BibleTestament]
  selectBook: [bookId: number]
  selectChapter: [chapter: number]
}>()

const { t } = useI18n()

const {
  isMobile,
  activePanel,
  booksCollapsed,
  chaptersCollapsed,
  toggleBooks,
  toggleChapters,
  onBookSelected,
  onChapterSelected,
} = useBibleNavCollapse()

const allCollapsed = computed(() => booksCollapsed.value && chaptersCollapsed.value)

const selectedBookName = computed(() => {
  if (!props.selectedBookId) return null
  return props.books.find((b) => b.id === props.selectedBookId)?.name ?? null
})

function handleSelectBook(bookId: number) {
  emit('selectBook', bookId)
  onBookSelected()
}

function handleSelectChapter(chapter: number) {
  emit('selectChapter', chapter)
  onChapterSelected()
}
</script>

<template>
  <GlassCard
    class="bible-nav-panel"
    :class="{ 'bible-nav-panel--mobile': isMobile }"
    :padding="false"
    elevated
  >
    <!-- ═══ DESKTOP: layout original lado a lado ═══ -->
    <div
      v-if="!isMobile"
      class="bible-nav-panel__inner"
    >
      <BibleBookGrid
        :books="books"
        :selected-book-id="selectedBookId"
        :testament="testament"
        :search-query="bookSearchQuery"
        @update:search-query="emit('update:bookSearchQuery', $event)"
        @update:testament="emit('update:testament', $event)"
        @select-book="emit('selectBook', $event)"
      />

      <div
        class="bible-nav-panel__divider"
        aria-hidden="true"
      />

      <BibleChapterGrid
        :chapters="chapters"
        :selected-chapter="selectedChapter"
        :search-query="chapterSearchQuery"
        @update:search-query="emit('update:chapterSearchQuery', $event)"
        @select-chapter="emit('selectChapter', $event)"
      />
    </div>

    <!-- ═══ MOBILE: paineis colapsaveis ═══ -->
    <div
      v-else
      class="bible-nav-panel__mobile"
      :class="{ 'bible-nav-panel__mobile--all-collapsed': allCollapsed }"
    >
      <!-- Header colapsavel: Livros -->
      <button
        type="button"
        class="bible-nav-panel__collapse-header"
        :class="{ 'bible-nav-panel__collapse-header--active': !booksCollapsed }"
        :aria-expanded="!booksCollapsed"
        @click="toggleBooks"
      >
        <i
          class="ti ti-book-2"
          aria-hidden="true"
        />
        <span class="bible-nav-panel__collapse-label">
          {{ booksCollapsed && selectedBookName ? selectedBookName : t('bible.books') }}
        </span>
        <i
          class="ti bible-nav-panel__collapse-chevron"
          :class="booksCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'"
          aria-hidden="true"
        />
      </button>

      <!-- Grid de Livros -->
      <div
        v-show="!booksCollapsed"
        class="bible-nav-panel__mobile-content"
      >
        <BibleBookGrid
          :books="books"
          :selected-book-id="selectedBookId"
          :testament="testament"
          :search-query="bookSearchQuery"
          @update:search-query="emit('update:bookSearchQuery', $event)"
          @update:testament="emit('update:testament', $event)"
          @select-book="handleSelectBook"
        />
      </div>

      <!-- Header colapsavel: Capitulos (so aparece se livro selecionado) -->
      <button
        v-if="selectedBookId"
        type="button"
        class="bible-nav-panel__collapse-header"
        :class="{ 'bible-nav-panel__collapse-header--active': !chaptersCollapsed }"
        :aria-expanded="!chaptersCollapsed"
        @click="toggleChapters"
      >
        <i
          class="ti ti-list-numbers"
          aria-hidden="true"
        />
        <span class="bible-nav-panel__collapse-label">
          {{ chaptersCollapsed ? (selectedChapter != null ? `${t('bible.chapter')} ${selectedChapter}` : t('bible.chapters')) : t('bible.chapters') }}
        </span>
        <i
          class="ti bible-nav-panel__collapse-chevron"
          :class="chaptersCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'"
          aria-hidden="true"
        />
      </button>

      <!-- Grid de Capitulos -->
      <div
        v-show="!chaptersCollapsed && selectedBookId"
        class="bible-nav-panel__mobile-content"
      >
        <BibleChapterGrid
          :chapters="chapters"
          :selected-chapter="selectedChapter"
          :search-query="chapterSearchQuery"
          @update:search-query="emit('update:chapterSearchQuery', $event)"
          @select-chapter="handleSelectChapter"
        />
      </div>
    </div>

    <span class="visually-hidden">{{ t('bible.browseBooksAndChapters') }}</span>
  </GlassCard>
</template>

<style scoped lang="scss">
.bible-nav-panel {
  display: flex;
  flex-direction: column;
}

// ═══ DESKTOP ═══
.bible-nav-panel__inner {
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  padding: 1.25rem;
  min-height: 0;
}

.bible-nav-panel__divider {
  width: 1px;
  height: auto;
  align-self: stretch;
  background: var(--ds-color-outline);
  flex-shrink: 0;
}

// ═══ MOBILE ═══
// User quer: SEM scrollbar interna no nav-panel.
// O conteudo cresce naturalmente e a pagina rola com a barra do browser.
.bible-nav-panel__mobile {
  display: flex;
  flex-direction: column;
  // Sem max-height, sem overflow - deixa o conteudo fluir naturalmente
}

.bible-nav-panel__collapse-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--ds-color-outline);
  background: color-mix(in srgb, var(--ds-color-surface-container) 50%, transparent);
  color: var(--ds-color-on-surface);
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;

  .ti {
    font-size: 1.15rem;
  }

  &:hover {
    background: color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface-container));
  }

  &:active {
    background: color-mix(in srgb, var(--ds-color-primary) 14%, var(--ds-color-surface-container));
  }

  &--active {
    border-bottom-color: color-mix(in srgb, var(--ds-color-primary) 35%, transparent);
  }

  // Compactar quando colapsado
  .bible-nav-panel__mobile & {
    padding: 0.55rem 0.75rem;
    font-size: 0.85rem;
    gap: 0.45rem;

    .ti {
      font-size: 1rem;
    }
  }
}

.bible-nav-panel__collapse-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bible-nav-panel__collapse-chevron {
  flex-shrink: 0;
  transition: transform 200ms ease;
}

.bible-nav-panel__mobile-content {
  padding: 0.5rem;
  // SEM overflow-y - user quer apenas barra de rolagem do browser
  flex: 0 0 auto;

  :deep(.bible-books) {
    width: 100%;
    container-type: normal;
  }

  :deep(.bible-chapters) {
    width: 100%;
    container-type: normal;
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
