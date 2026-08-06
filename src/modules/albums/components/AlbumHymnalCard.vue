<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import type { AlbumCollection } from '../types/albums'

const props = defineProps<{
  collection: AlbumCollection
}>()

const emit = defineEmits<{
  open: []
}>()

const { t } = useI18n()

const displayName = computed(() => {
  if (props.collection.id === 'hymnal_1996') return t('albums.hymnal.edition1996Name')
  return props.collection.name
})

const subtitle = computed(() => {
  const songCount = props.collection.trackCount
  if (songCount != null) {
    const key =
      props.collection.id === 'hymnal_1996'
        ? 'albums.hymnal.edition1996Subtitle'
        : 'albums.hymnal.officialSubtitle'
    return t(key, { count: songCount })
  }

  return props.collection.subtitle || null
})

const coverIcon = computed(() =>
  props.collection.id === 'hymnal_1996' ? 'ti-history' : 'ti-book-2',
)
</script>

<template>
  <GlassCard
    class="album-hymnal-card"
    :padding="false"
  >
    <button
      type="button"
      class="album-hymnal-card__open"
      :aria-label="displayName"
      @click="emit('open')"
    >
      <div class="album-hymnal-card__cover">
        <i
          class="ti album-hymnal-card__fallback-icon"
          :class="coverIcon"
          aria-hidden="true"
        />
      </div>

      <div class="album-hymnal-card__body">
        <h4 class="album-hymnal-card__name">
          {{ displayName }}
        </h4>

        <p
          v-if="subtitle"
          class="album-hymnal-card__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
    </button>
  </GlassCard>
</template>

<style scoped lang="scss">
.album-hymnal-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow: hidden;
  border-radius: 1rem 0 1rem 0 !important;
  transition:
    background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 300ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
  }
}

.album-hymnal-card__open {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 1.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.album-hymnal-card__cover {
  display: flex;
  width: 5rem;
  height: 6rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.75rem 0 0.75rem 0;
  border: 1px solid color-mix(in srgb, var(--ds-color-on-surface) 10%, transparent);
  background: var(--ds-color-surface-container-high, #2a2a2a);
  box-shadow: 0 12px 24px rgb(0 0 0 / 35%);
}

.album-hymnal-card__fallback-icon {
  font-size: 2.75rem;
  color: var(--ds-color-primary);
  line-height: 1;
}

.album-hymnal-card__body {
  min-width: 0;
  flex: 1;
  padding-right: 0.5rem;
}

.album-hymnal-card__name {
  margin: 0 0 0.25rem;
  color: var(--ds-color-on-surface);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.album-hymnal-card__subtitle {
  margin: 0;
  color: var(--ds-color-on-surface-variant);
  font-size: 14px;
  line-height: 20px;
}

@media (max-width: 1280px) {
  .album-hymnal-card {
    gap: 1rem;
    padding: 1rem;
  }

  .album-hymnal-card__open {
    gap: 1rem;
  }

  .album-hymnal-card__cover {
    width: 4rem;
    height: 5rem;
  }

  .album-hymnal-card__fallback-icon {
    font-size: 2rem;
  }

  .album-hymnal-card__name {
    font-size: 16px;
    line-height: 22px;
  }

  .album-hymnal-card__subtitle {
    font-size: 13px;
    line-height: 18px;
  }
}
</style>
