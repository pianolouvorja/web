<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { MediaCollectionList } from '@design-system/index'

import AlbumLyricDialog from '../components/AlbumLyricDialog.vue'
import AlbumTrackRow from '../components/AlbumTrackRow.vue'
import { useAlbums } from '../composables/useAlbums'

const { t } = useI18n()

import {
  addPlaylistItem,
  listPlaylists,
  type PlaylistItem,
} from '../services/playlist-storage'
import type { AlbumTrack } from '../types/albums'

const playlistItem = ref<PlaylistItem | null>(null)
const playlists = ref(listPlaylists())
const playlistFeedback = ref('')

let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function showPlaylistFeedback(message: string) {
  playlistFeedback.value = message
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    playlistFeedback.value = ''
  }, 2600)
}

function openPlaylistPicker(track: AlbumTrack) {
  playlists.value = listPlaylists()
  playlistItem.value = {
    musicId: track.musicId,
    albumId: Number(activeCollection.value?.id) || null,
    title: track.name,
  }
}

function closePlaylistPicker() {
  playlistItem.value = null
}

function addToPlaylist(id: string) {
  const item = playlistItem.value
  if (!item) return
  const target = playlists.value.find((playlist) => playlist.id === id)
  const result = addPlaylistItem(id, item)
  playlists.value = listPlaylists()
  playlistItem.value = null
  if (result?.added) {
    showPlaylistFeedback(`“${item.title}” adicionada a “${target?.name ?? 'playlist'}”`)
  } else {
    showPlaylistFeedback(`“${item.title}” já está em “${target?.name ?? 'playlist'}”`)
  }
}
const route = useRoute()
const router = useRouter()

const {
  activeCollection,
  filteredTracks,
  searchQuery,
  isLoadingTracks,
  lastErrorKey,
  lastActionMessageKey,
  lyricOpen,
  lyricDoc,
  isLoadingLyric,
  openCollection,
  clearError,
  clearActionMessage,
  playSung,
  playInstrumental,
  playSlides,
  openLyric,
  closeLyric,
  playAllInActiveCollection,
} = useAlbums()

const busyMusicId = ref<number | null>(null)

const collectionId = computed(() => String(route.params.collectionId ?? ''))

const title = computed(
  () => activeCollection.value?.name || t('albums.collectionFallback'),
)

async function load() {
  clearError()
  await openCollection(collectionId.value)
}

onMounted(() => {
  load()
})

watch(collectionId, () => {
  load()
})

function goBack() {
  router.push({ name: 'albums' })
}

async function runAction(
  musicId: number,
  action: () => Promise<boolean | void>,
) {
  busyMusicId.value = musicId
  try {
    await action()
  } finally {
    busyMusicId.value = null
  }
}
</script>

<template>
  <section class="album-collection-view">
    <header class="album-collection-view__header">
      <div class="album-collection-view__brand">
        <button
          type="button"
          class="album-collection-view__back"
          :aria-label="t('albums.back')"
          :title="t('albums.back')"
          @click="goBack"
        >
          <i
            class="ti ti-arrow-left"
            aria-hidden="true"
          />
        </button>

        <div class="album-collection-view__icon">
          <i
            class="ti"
            :class="
              activeCollection?.kind === 'hymnal'
                ? 'ti-book'
                : 'ti-disc'
            "
            aria-hidden="true"
          />
        </div>

        <h1 class="album-collection-view__title">
          {{ title }}
        </h1>
      </div>

      <v-btn
        v-if="activeCollection?.kind !== 'hymnal' && filteredTracks.length > 0"
        size="small"
        color="primary"
        prepend-icon="mdi-play"
        @click="playAllInActiveCollection()"
      >
        Tocar tudo
      </v-btn>
    </header>

    <div
      v-if="lastActionMessageKey && !lastActionMessageKey.startsWith('media.messages.')"
      class="album-collection-view__alert"
      role="status"
    >
      <p>{{ t(lastActionMessageKey) }}</p>
      <button
        type="button"
        @click="clearActionMessage"
      >
        {{ t('albums.dismiss') }}
      </button>
    </div>

    <div
      v-if="lastErrorKey"
      class="album-collection-view__alert"
      role="alert"
    >
      <p>{{ t(lastErrorKey) }}</p>
      <button
        type="button"
        @click="load"
      >
        {{ t('albums.retry') }}
      </button>
    </div>

    <MediaCollectionList
      v-model="searchQuery"
      :search-placeholder="t('albums.searchPlaceholder')"
      :search-aria-label="t('albums.searchPlaceholder')"
      :clear-aria-label="t('albums.clearSearch')"
      :number-label="t('albums.columns.number')"
      :title-label="t('albums.columns.title')"
      :duration-label="t('albums.columns.duration')"
      :actions-label="t('albums.columns.actions')"
      :loading="isLoadingTracks"
      :loading-label="t('albums.loading')"
      :empty="!isLoadingTracks && filteredTracks.length === 0"
      :empty-label="
        searchQuery.trim()
          ? t('albums.messages.searchEmpty')
          : t('albums.messages.tracksEmpty')
      "
    >
      <AlbumTrackRow
        v-for="track in filteredTracks"
        :key="track.musicId"
        :track="track"
        :collection-name="title"
        :artwork-url="activeCollection?.coverUrl"
        :busy="busyMusicId === track.musicId"
        @sung="runAction(track.musicId, () => playSung(track.musicId))"
        @instrumental="
          runAction(track.musicId, () => playInstrumental(track.musicId))
        "
        @slides="runAction(track.musicId, () => playSlides(track.musicId))"
        @lyric="runAction(track.musicId, () => openLyric(track.musicId))"
        @playlist="openPlaylistPicker(track)"
      />
    </MediaCollectionList>

    <AlbumLyricDialog
      :open="lyricOpen"
      :loading="isLoadingLyric"
      :document="lyricDoc"
      @close="closeLyric"
    />
    <Teleport to="body">
      <Transition name="playlist-toast">
        <div v-if="playlistFeedback" class="playlist-toast" role="status" aria-live="polite">
          <i class="ti ti-circle-check" aria-hidden="true" />
          {{ playlistFeedback }}
        </div>
      </Transition>
    </Teleport>

    <v-dialog
      :model-value="Boolean(playlistItem)"
      max-width="26rem"
      @update:model-value="closePlaylistPicker"
    >
      <v-card v-if="playlistItem" class="playlist-picker">
        <div class="playlist-picker__header">
          <div class="playlist-picker__track">
            <span class="playlist-picker__track-icon">
              <i class="ti ti-music" aria-hidden="true" />
            </span>
            <div class="playlist-picker__track-info">
              <small>Adicionar à playlist</small>
              <strong>{{ playlistItem.title }}</strong>
            </div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" aria-label="Fechar" @click="closePlaylistPicker" />
        </div>

        <div class="playlist-picker__body">
          <p v-if="playlists.length === 0" class="playlist-picker__empty">
            Você ainda não tem playlists.<br>
            Crie uma na seção Playlists da Central de Mídia.
          </p>
          <button
            v-for="playlist in playlists"
            :key="playlist.id"
            type="button"
            class="playlist-picker__option"
            @click="addToPlaylist(playlist.id)"
          >
            <i class="ti ti-playlist" aria-hidden="true" />
            <span class="playlist-picker__name">{{ playlist.name }}</span>
            <small class="playlist-picker__count">{{ playlist.items.length }}</small>
          </button>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped lang="scss">
.album-collection-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
  height: calc(
    (100 * var(--ui-vh)) - var(--app-titlebar-height, 0px) - var(--ds-header-height, 5.5rem) -
      var(--ds-dock-height)
  );
  max-height: calc(
    (100 * var(--ui-vh)) - var(--app-titlebar-height, 0px) - var(--ds-header-height, 5.5rem) -
      var(--ds-dock-height)
  );
  padding: 0.75rem var(--ds-spacing-page, 2rem) 1rem;
  overflow: hidden;
}

.album-collection-view__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
}

.album-collection-view__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.album-collection-view__back {
  width: 2.4rem;
  height: 2.4rem;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-surface-card) 80%, transparent);
  color: var(--ds-color-on-surface);
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
  }
}

.album-collection-view__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem 0 0.75rem 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-color-primary);
  color: var(--ds-color-on-primary);
  flex-shrink: 0;

  .ti {
    font-size: 1.35rem;
  }
}

.album-collection-view__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-collection-view__alert {
  border-radius: var(--ds-radius-lg, 1rem 0 1rem 0);
  background: color-mix(in srgb, var(--ds-color-surface-card) 72%, transparent);
  border: 1px solid var(--ds-color-outline-strong);
  padding: 1.25rem 1.4rem;
  color: var(--ds-color-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;

  button {
    border: 1px solid var(--ds-color-outline-strong);
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    background: transparent;
    color: var(--ds-color-on-surface);
    cursor: pointer;
  }
}

@media (max-width: 1280px) {
  .album-collection-view {
    gap: 0.75rem;
    padding: 0.5rem 1rem 0.65rem;
  }

  .album-collection-view__header {
    gap: 0.75rem;
  }

  .album-collection-view__icon {
    width: 2.25rem;
    height: 2.25rem;

    .ti {
      font-size: 1.15rem;
    }
  }

  .album-collection-view__title {
    font-size: 1.15rem;
  }
}
</style>
.playlist-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
}

.playlist-picker__track {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.playlist-picker__track-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 8px;
  background: rgba(251, 140, 0, 0.15);
  color: rgb(251, 140, 0);
}

.playlist-picker__track-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.playlist-picker__track-info small {
  color: rgba(125, 137, 155, 1);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.playlist-picker__track-info strong {
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-picker__body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0 0.75rem 0.9rem;
}

.playlist-picker__option {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
  text-align: left;
}

.playlist-picker__option > .ti-playlist {
  color: rgb(251, 140, 0);
}

.playlist-picker__option:hover {
  border-color: rgba(251, 140, 0, 0.4);
  background: rgba(251, 140, 0, 0.06);
}

.playlist-picker__name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-picker__count {
  color: rgba(125, 137, 155, 1);
  font-size: 0.72rem;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  background: rgba(125, 137, 155, 0.15);
}

.playlist-picker__empty {
  padding: 1rem;
  color: rgba(125, 137, 155, 1);
  font-size: 0.85rem;
  text-align: center;
  border: 1px dashed rgba(125, 137, 155, 0.4);
  border-radius: 8px;
}

.playlist-toast {
  position: fixed;
  bottom: 5.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  background: rgb(30 30 30);
  border: 1px solid rgba(251, 140, 0, 0.35);
  color: rgb(238, 236, 235);
  font-size: 0.88rem;
  z-index: 2000;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.4);
}

.playlist-toast .ti {
  color: rgb(251, 140, 0);
}

.playlist-toast-enter-active,
.playlist-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.playlist-toast-enter-from,
.playlist-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}
