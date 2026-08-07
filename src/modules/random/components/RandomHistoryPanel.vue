<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  items: readonly string[]
  totalCount: number
}>()

const emit = defineEmits<{
  undo: [index: number]
  clear: []
}>()

const { t } = useI18n()
</script>

<template>
  <aside class="random-history">
    <header class="random-history__head">
      <h2 class="random-history__title">
        {{ t('random.drawn') }}
      </h2>
      <span class="random-history__badge">
        {{ totalCount }}
      </span>
    </header>

    <div class="random-history__list-wrap">
      <div
        v-if="items.length === 0"
        class="random-history__empty"
      >
        <i
          class="ti ti-history"
          aria-hidden="true"
        />
        <p>{{ t('random.emptyHistory') }}</p>
      </div>
      <ul
        v-else
        class="random-history__list"
      >
        <li
          v-for="(name, index) in items"
          :key="`${name}-${index}`"
          class="random-history__item"
        >
          <span class="random-history__rank">
            {{ totalCount - index }}
          </span>
          <span class="random-history__name">{{ name }}</span>
          <button
            type="button"
            class="random-history__undo"
            :aria-label="t('random.undoDrawn')"
            @click="emit('undo', totalCount - 1 - index)"
          >
            <i
              class="ti ti-arrow-back-up"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="random-history__clear"
      @click="emit('clear')"
    >
      {{ t('random.clearHistory') }}
    </button>
  </aside>
</template>

<style scoped lang="scss">
.random-history {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 0.9rem 1rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-on-surface) 10%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ds-color-surface-elevated) 72%, transparent);
  backdrop-filter: blur(16px);
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 0.75rem;
    border-radius: 0.85rem;
  }
}

.random-history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.random-history__title {
  margin: 0;
  color: var(--ds-color-secondary, #78d6d2);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.random-history__badge {
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ds-color-secondary, #78d6d2) 20%, transparent);
  color: var(--ds-color-secondary, #78d6d2);
  font-size: 0.65rem;
  font-weight: 600;
}

.random-history__list-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, transparent, black 6%, black 94%, transparent);
}

.random-history__list {
  height: 100%;
  margin: 0;
  padding: 0.35rem 0.15rem;
  overflow-y: auto;
  list-style: none;
}

.random-history__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-secondary, #78d6d2) 20%, transparent);
  border-radius: 0.45rem;
  background: color-mix(in srgb, var(--ds-color-secondary, #78d6d2) 10%, transparent);
}

.random-history__rank {
  display: inline-flex;
  width: 1.35rem;
  height: 1.35rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ds-color-secondary, #78d6d2);
  color: var(--ds-color-on-secondary, #003736);
  font-size: 0.65rem;
  font-weight: 700;
}

.random-history__name {
  flex: 1;
  min-width: 0;
  color: var(--ds-color-secondary, #78d6d2);
  font-size: 0.8125rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.random-history__undo {
  display: inline-flex;
  border: 0;
  background: transparent;
  color: var(--ds-color-error, #ffb4ab);
  cursor: pointer;
  opacity: 0.55;

  .random-history__item:hover & {
    opacity: 1;
  }

  .ti {
    font-size: 0.95rem;
  }
}

.random-history__empty {
  display: flex;
  height: 100%;
  min-height: 6rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  opacity: 0.4;
  color: var(--ds-color-on-surface-variant);
  text-align: center;

  .ti {
    font-size: 1.75rem;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
  }
}

.random-history__clear {
  margin-top: 0.65rem;
  border: 0;
  background: transparent;
  color: var(--ds-color-on-surface-variant);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 160ms ease;

  &:hover {
    color: var(--ds-color-error, #ffb4ab);
  }
}
</style>
