<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { AlbumCollection } from '../types/albums'

const _props = defineProps<{
  collection: AlbumCollection
}>()

const emit = defineEmits<{
  open: []
}>()

const { t } = useI18n()

function _onOpen() {
  emit('open')
}
</script>

<template>
  <article class="album-collection-card">
    <div
      class="album-collection-card__cover"
      :style="
        collection.coverUrl
          ? { backgroundImage: `url(${collection.coverUrl})` }
          : undefined
      "
    >
      <i
        v-if="!collection.coverUrl"
        class="ti album-collection-card__fallback"
        :class="collection.kind === 'hymnal' ? 'ti-book' : 'ti-disc'"
        aria-hidden="true"
      />

      <div class="album-collection-card__hover">
        <button
          type="button"
          class="album-collection-card__play"
          :aria-label="t('albums.openCollection', { name: collection.name })"
          @click="onOpen"
        >
          <span class="album-collection-card__play-btn">
            <i
              class="ti ti-player-play"
              aria-hidden="true"
            />
          </span>
        </button>
      </div>
    </div>

    <div class="album-collection-card__body">
      <h3 class="album-collection-card__name">
        {{ collection.name }}
      </h3>
      <p
        v-if="collection.subtitle"
        class="album-collection-card__subtitle"
      >
        {{ collection.subtitle }}
      </p>
      <p
        v-if="collection.trackCount != null"
        class="album-collection-card__meta"
      >
        {{ t('albums.trackCount', { count: collection.trackCount }) }}
      </p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.album-collection-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.album-collection-card__cover {
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--ds-color-outline-strong);
  border-radius: var(--ds-radius-lg, 1rem 0 1rem 0);
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--ds-color-primary) 35%, #111), #1a1a1a);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 160ms ease,
    border-color 160ms ease;

  .album-collection-card:hover & {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--ds-color-primary) 45%, transparent);
  }
}

.album-collection-card__fallback {
  font-size: 2.5rem;
  color: color-mix(in srgb, #fff 70%, transparent);
}

.album-collection-card__hover {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  background: rgb(0 0 0 / 45%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;

  .album-collection-card:hover & {
    opacity: 1;
    pointer-events: auto;
  }
}

.album-collection-card__play {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.album-collection-card__play-btn {
  display: inline-flex;
  width: 3.25rem;
  height: 3.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ds-color-primary) 92%, transparent);
  color: var(--ds-color-on-primary, #003258);
  box-shadow: 0 12px 28px rgb(0 0 0 / 40%);
  transform: scale(0.88);
  transition: transform 180ms ease;

  .album-collection-card:hover & {
    transform: scale(1);
  }

  .ti {
    font-size: 1.6rem;
    line-height: 1;
    color: inherit;
  }
}

.album-collection-card__body {
  padding: 0 0.15rem;
}

.album-collection-card__name {
  margin: 0;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-collection-card__subtitle,
.album-collection-card__meta {
  margin: 0.3rem 0 0;
  font-size: 0.78rem;
  color: var(--ds-color-on-surface-variant);
}
</style>
