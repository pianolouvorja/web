<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { resolveBookTone } from '../services/bible-catalog'
import type { BibleBook, BibleTestament } from '../types/bible'

defineProps<{
  books: BibleBook[]
  selectedBookId: number | null
  testament: BibleTestament
  searchQuery: string
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:testament': [value: BibleTestament]
  selectBook: [bookId: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="bible-books">
    <div class="bible-books__search">
      <i
        class="ti ti-search bible-books__search-icon"
        aria-hidden="true"
      />
      <input
        class="bible-books__search-input"
        type="search"
        :value="searchQuery"
        :placeholder="t('bible.searchBook')"
        :aria-label="t('bible.searchBook')"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <div class="bible-books__header">
      <h2 class="bible-books__title">
        {{ t('bible.books') }}
      </h2>
      <div
        class="bible-books__tabs"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          class="bible-books__tab"
          :class="{ 'bible-books__tab--active': testament === 'ot' }"
          :aria-selected="testament === 'ot'"
          @click="emit('update:testament', 'ot')"
        >
          {{ t('bible.testamentOld') }}
        </button>
        <button
          type="button"
          role="tab"
          class="bible-books__tab"
          :class="{ 'bible-books__tab--active': testament === 'nt' }"
          :aria-selected="testament === 'nt'"
          @click="emit('update:testament', 'nt')"
        >
          {{ t('bible.testamentNew') }}
        </button>
      </div>
    </div>

    <div class="bible-books__grid">
      <button
        v-for="book in books"
        :id="`bible-book-${book.id}`"
        :key="book.id"
        type="button"
        class="bible-books__tile"
        :class="[
          `bible-books__tile--${resolveBookTone(book.bookNumber)}`,
          { 'bible-books__tile--active': book.id === selectedBookId },
        ]"
        @click="emit('selectBook', book.id)"
      >
        <span class="bible-books__abbr">{{ book.abbreviation }}</span>
        <span class="bible-books__name">{{ book.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bible-books {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 60%;
  container-type: inline-size;
  container-name: bible-books;
}

.bible-books__search {
  position: relative;
  margin-bottom: 1rem;
  flex-shrink: 0;
  padding: 2px;
}

.bible-books__search-icon {
  position: absolute;
  left: calc(0.75rem + 2px);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ds-color-on-surface-variant);
  font-size: 1rem;
  pointer-events: none;
}

.bible-books__search-input {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--ds-color-outline-strong) 80%, transparent);
  border-radius: var(--ds-radius-md, 0.5rem 0 0.5rem 0);
  background: var(--ds-color-surface-container);
  color: var(--ds-color-on-surface);
  padding: 0.55rem 0.75rem 0.55rem 2.35rem;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:focus {
    border-color: color-mix(in srgb, var(--ds-color-primary) 70%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ds-color-primary) 35%, transparent);
  }
}


.bible-books__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.bible-books__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-color-primary-soft);
}

.bible-books__tabs {
  display: inline-flex;
  gap: 0.15rem;
  padding: 0.2rem;
  border-radius: var(--ds-radius-md, 0.5rem 0 0.5rem 0);
  background: var(--ds-color-surface-container);
}

.bible-books__tab {
  border: 0;
  border-radius: 0.4rem 0 0.4rem 0;
  background: transparent;
  color: var(--ds-color-on-surface-variant);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    color 200ms ease;

  // AT ativo = âmbar quente (terroso)
  &--active:first-child,
  &--active:nth-child(1) {
    background: color-mix(in srgb, var(--ds-color-brand-yellow) 70%, var(--ds-color-primary));
    color: #fffbeb;
    box-shadow: 0 1px 2px color-mix(in srgb, var(--ds-color-brand-yellow) 30%, transparent);
  }

  // NT ativo = azul frio (espiritual)
  &--active:last-child,
  &--active:nth-child(2) {
    background: var(--ds-color-primary);
    color: var(--ds-color-on-primary);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--ds-color-primary) 25%, transparent);
  }
}

.bible-books__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  padding-right: 0.25rem;
  align-content: start;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--ds-color-outline);
    border-radius: 999px;
  }
}

@container bible-books (min-width: 40rem) {
  .bible-books__grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .bible-books__abbr {
    font-size: 0.95rem;
  }

  .bible-books__name {
    font-size: 9px;
  }
}

.bible-books__tile {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md, 0.5rem 0 0.5rem 0);
  padding: 0.35rem;
  text-align: center;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgb(0 0 0 / 0.3);
  }

  // ═══════════════════════════════════════════════════
  //  ANTIGO TESTAMENTO — tons quentes / terrosos
  // ═══════════════════════════════════════════════════
  &--law {
    background: color-mix(in srgb, var(--ds-color-brand-yellow) 22%, var(--ds-color-surface-card));
    color: color-mix(in srgb, var(--ds-color-brand-yellow) 75%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, var(--ds-color-brand-yellow) 30%, transparent);
  }

  &--history {
    background: color-mix(in srgb, #4d7c0f 35%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #86efac 80%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #4d7c0f 40%, transparent);
  }

  &--poetry {
    background: color-mix(in srgb, #92400e 22%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #fbbf24 78%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #92400e 32%, transparent);
  }

  &--major-prophet {
    background: color-mix(in srgb, #c2410c 30%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #fdba74 80%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #c2410c 40%, transparent);
  }

  &--minor-prophet {
    background: color-mix(in srgb, #b45309 26%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #fcd34d 78%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #b45309 38%, transparent);
  }

  // ═══════════════════════════════════════════════════
  //  NOVO TESTAMENTO — tons frios / espirituais
  // ═══════════════════════════════════════════════════
  &--gospels {
    background: color-mix(in srgb, var(--ds-color-primary) 30%, var(--ds-color-surface-card));
    color: color-mix(in srgb, var(--ds-color-primary-soft) 85%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, var(--ds-color-primary) 40%, transparent);
  }

  &--acts {
    background: color-mix(in srgb, var(--ds-color-secondary) 28%, var(--ds-color-surface-card));
    color: color-mix(in srgb, var(--ds-color-secondary) 85%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, var(--ds-color-secondary) 40%, transparent);
  }

  &--pauline {
    background: color-mix(in srgb, #6366f1 28%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #a5b4fc 82%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #6366f1 40%, transparent);
  }

  &--general {
    background: color-mix(in srgb, #0891b2 26%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #67e8f9 82%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #0891b2 38%, transparent);
  }

  &--apocalyptic {
    background: color-mix(in srgb, var(--ds-color-brand-yellow) 18%, #7c2d12 30%, var(--ds-color-surface-card));
    color: color-mix(in srgb, #fde68a 85%, var(--ds-color-on-surface));
    border-color: color-mix(in srgb, #f59e0b 45%, transparent);
  }

  &--neutral {
    background: rgba(255, 255, 255, 0.07);
    color: var(--ds-color-on-surface-variant);
  }

  &--active {
    background: color-mix(in srgb, var(--ds-color-brand-yellow) 50%, transparent);
    border-color: var(--ds-color-brand-yellow);
    color: #fffbeb;
    font-weight: 700;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ds-color-brand-yellow) 35%, transparent);
  }
}

.bible-books__abbr {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.1;
}

.bible-books__name {
  font-size: 10px;
  opacity: 0.85;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<style lang="scss">
[data-mode='light'] .bible-books__search-input {
  background: #f7f8fc;
  border-color: #e8ecf3;
}

[data-mode='light'] .bible-books__search-input:focus {
  background: #fff;
}

[data-mode='light'] .bible-books__tabs {
  background: #f7f8fc;
}

[data-mode='light'] .bible-books__tile:hover {
  box-shadow: none;
  filter: brightness(0.97);
}

[data-mode='light'] .bible-books__tile--law {
  background: #fef3c7;
  color: #92400e;
  border-color: #f59e0b;
}

[data-mode='light'] .bible-books__tile--history {
  background: #d9f99d;
  color: #365314;
  border-color: #65a30d;
}

[data-mode='light'] .bible-books__tile--poetry {
  background: #fef9c3;
  color: #78350f;
  border-color: #d97706;
}

[data-mode='light'] .bible-books__tile--major-prophet {
  background: #fed7aa;
  color: #9a3412;
  border-color: #ea580c;
}

[data-mode='light'] .bible-books__tile--minor-prophet {
  background: #fde68a;
  color: #854d0e;
  border-color: #d97706;
}

[data-mode='light'] .bible-books__tile--gospels {
  background: #dbeafe;
  color: #1e40af;
  border-color: #3b82f6;
}

[data-mode='light'] .bible-books__tile--acts {
  background: #cffafe;
  color: #155e75;
  border-color: #06b6d4;
}

[data-mode='light'] .bible-books__tile--pauline {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #6366f1;
}

[data-mode='light'] .bible-books__tile--general {
  background: #ccfbf1;
  color: #115e59;
  border-color: #14b8a6;
}

[data-mode='light'] .bible-books__tile--apocalyptic {
  background: #fef9c3;
  color: #713f12;
  border-color: #ca8a04;
}

[data-mode='light'] .bible-books__tile--neutral {
  background: #f1f3f7;
  color: #475569;
  border-color: #e2e8f0;
}

[data-mode='light'] .bible-books__tile--active {
  background: #fdba74;
  border-color: #ea580c;
  color: #7c2d12;
  filter: none;
  box-shadow: 0 2px 8px rgb(234 88 12 / 0.28);
}

[data-mode='light'] .bible-books__name {
  opacity: 1;
}
</style>