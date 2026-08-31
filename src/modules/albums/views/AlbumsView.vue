<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { GlassCard } from '@design-system/index'

import AlbumCollectionCard from '../components/AlbumCollectionCard.vue'
import AlbumHymnalCard from '../components/AlbumHymnalCard.vue'
import AlbumLyricDialog from '../components/AlbumLyricDialog.vue'
import AlbumSearchHitRow from '../components/AlbumSearchHitRow.vue'
import { useAlbums } from '../composables/useAlbums'
import type { AlbumCategory } from '../types/albums'

const { t } = useI18n()

import {
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  removePlaylistItem,
  savePlaylists,
  type Playlist,
} from '../services/playlist-storage'
import {
  parsePlaylistsImport,
  serializePlaylists,
} from '../services/playlist-io'
import { useMediaStore } from '../../media/stores/useMediaStore'

const mediaStore = useMediaStore()
const playlists = ref<Playlist[]>(listPlaylists())
const newPlaylistName = ref('')
const expandedPlaylistId = ref<string | null>(null)
const importFeedback = ref('')
let importFeedbackTimer: ReturnType<typeof setTimeout> | null = null

function showImportFeedback(message: string) {
  importFeedback.value = message
  if (importFeedbackTimer) clearTimeout(importFeedbackTimer)
  importFeedbackTimer = setTimeout(() => {
    importFeedback.value = ''
  }, 2600)
}

const fileInput = ref<HTMLInputElement | null>(null)

function exportPlaylists() {
  if (playlists.value.length === 0) return
  const payload = JSON.stringify(serializePlaylists(playlists.value), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const today = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `playlists-${today}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function onImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Permite re-selecionar o mesmo arquivo depois.
  input.value = ''
  if (!file) return
  void file.text().then((raw) => {
    const result = parsePlaylistsImport(raw)
    if (!result.ok) {
      showImportFeedback(t('albums.playlists.invalidFile'))
      return
    }
    // Merge por nome: playlist nova entra; existente ganha só faixas novas.
    const current = listPlaylists()
    const byName = new Map(current.map((p) => [p.name.toLowerCase(), p]))
    let addedTracks = 0
    let newLists = 0
    for (const imported of result.playlists) {
      const existing = byName.get(imported.name.toLowerCase())
      if (!existing) {
        current.push(imported)
        byName.set(imported.name.toLowerCase(), imported)
        newLists += 1
        addedTracks += imported.items.length
        continue
      }
      for (const item of imported.items) {
        const dup = existing.items.some(
          (i) => i.musicId === item.musicId && i.albumId === item.albumId,
        )
        if (!dup) {
          existing.items.push(item)
          addedTracks += 1
        }
      }
    }
    if (newLists > 0 || addedTracks > 0) {
      savePlaylists(current)
      playlists.value = listPlaylists()
    }
    const summary: string[] = []
    if (newLists > 0) {
      summary.push(
        t('albums.playlists.newLists', { count: newLists }),
      )
    }
    if (addedTracks > 0) {
      summary.push(
        t('albums.playlists.addedTracks', { count: addedTracks }),
      )
    }
    showImportFeedback(
      summary.length > 0
        ? t('albums.playlists.imported', { summary: summary.join(', ') })
        : t('albums.playlists.nothingToImport'),
    )
  })
}

function addPlaylist() {
  const name = newPlaylistName.value.trim()
  if (!name) return
  createPlaylist(name)
  playlists.value = listPlaylists()
  newPlaylistName.value = ''
}

function removePlaylist(id: string) {
  deletePlaylist(id)
  playlists.value = listPlaylists()
}

function removePlaylistTrack(id: string, index: number) {
  removePlaylistItem(id, index)
  playlists.value = listPlaylists()
}

function togglePlaylist(id: string) {
  expandedPlaylistId.value = expandedPlaylistId.value === id ? null : id
}

async function playPlaylist(playlist: Playlist) {
  if (playlist.items.length === 0) return
  await mediaStore.playQueue(playlist.items, 0)
  void router.push({ name: 'media' })
}
const router = useRouter()

const {
  categories,
  hubSearchQuery,
  hubSearchResults,
  isHubSearching,
  isLoadingCatalog,
  isLoadingMusicIndex,
  lastErrorKey,
  lastActionMessageKey,
  lyricOpen,
  lyricDoc,
  isLoadingLyric,
  clearError,
  clearActionMessage,
  hydrateCatalog,
  playSung,
  playInstrumental,
  playSlides,
  openLyric,
  closeLyric,
} = useAlbums()

const busyMusicId = ref<number | null>(null)

function isHymnalsCategory(category: AlbumCategory) {
  return String(category.id) === 'hymnals'
}

function categoryTitle(category: AlbumCategory) {
  if (isHymnalsCategory(category)) return t('albums.categories.hymnals')
  if (
    category.name === 'CDs Oficiais/Ano' ||
    /cds?\s*oficiais/i.test(category.name)
  ) {
    return t('albums.categories.youthAlbums')
  }
  return category.name
}

function categorySubtitle(category: AlbumCategory) {
  if (isHymnalsCategory(category)) return t('albums.categories.hymnalsSubtitle')
  if (
    category.name === 'CDs Oficiais/Ano' ||
    /cds?\s*oficiais/i.test(category.name)
  ) {
    return t('albums.categories.albumsSubtitle')
  }
  return t('albums.categories.defaultSubtitle')
}

function openCollection(collectionId: string | number) {
  router.push({
    name: 'albums-collection',
    params: { collectionId: String(collectionId) },
  })
}

function retry() {
  clearError()
  hydrateCatalog()
}

function clearHubSearch() {
  hubSearchQuery.value = ''
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
  <section class="albums-view">
    <header class="albums-view__header">
      <div class="albums-view__brand">
        <div class="albums-view__icon">
          <i
            class="ti ti-music"
            aria-hidden="true"
          />
        </div>
        <div class="albums-view__headings">
          <h1 class="albums-view__title">
            {{ t('albums.title') }}
          </h1>
          <p class="albums-view__subtitle">
            {{ t('albums.subtitle') }}
          </p>
        </div>
      </div>

      <div class="albums-view__header-actions">
        <label class="albums-view__search">
          <i
            class="ti ti-search"
            aria-hidden="true"
          />
          <input
            v-model="hubSearchQuery"
            type="search"
            :placeholder="t('albums.hubSearchPlaceholder')"
            :aria-label="t('albums.hubSearchPlaceholder')"
          >
          <button
            v-if="isHubSearching"
            type="button"
            class="albums-view__search-clear"
            :aria-label="t('albums.clearSearch')"
            :title="t('albums.clearSearch')"
            @click="clearHubSearch"
          >
            <i
              class="ti ti-x"
              aria-hidden="true"
            />
          </button>
        </label>
      </div>
    </header>

    <section class="albums-view__playlists" aria-labelledby="playlists-title">
      <header class="albums-view__playlists-header">
        <h2 id="playlists-title">
          <i class="ti ti-playlist" aria-hidden="true" /> {{ t('albums.playlists.title') }}
        </h2>
        <div class="albums-view__playlists-io">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-upload"
            data-testid="playlists-export"
            :disabled="playlists.length === 0"
            :title="t('albums.playlists.export')"
            @click="exportPlaylists"
          >
            {{ t('albums.playlists.export') }}
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-download"
            data-testid="playlists-import"
            :title="t('albums.playlists.import')"
            @click="fileInput?.click()"
          >
            {{ t('albums.playlists.import') }}
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            data-testid="playlists-import-input"
            aria-hidden="true"
            tabindex="-1"
            @change="onImportFileChange"
          >
        </div>
        <form @submit.prevent="addPlaylist">
          <input
            v-model="newPlaylistName"
            required
            :placeholder="t('albums.playlists.newPlaceholder')"
            :aria-label="t('albums.playlists.newPlaceholder')"
          >
          <v-btn type="submit" size="small" color="primary" prepend-icon="mdi-plus">
            {{ t('albums.playlists.create') }}
          </v-btn>
        </form>
      </header>

      <Teleport to="body">
        <Transition name="playlist-toast">
          <div v-if="importFeedback" class="playlist-toast" role="status" aria-live="polite">
            <i class="ti ti-circle-check" aria-hidden="true" />
            {{ importFeedback }}
          </div>
        </Transition>
      </Teleport>

      <div v-if="playlists.length === 0" class="albums-view__playlists-empty">
        {{ t('albums.playlists.empty') }}
      </div>

      <div v-else class="albums-view__playlists-list">
        <article v-for="playlist in playlists" :key="playlist.id" class="albums-view__playlist">
          <div class="albums-view__playlist-row">
            <button type="button" class="albums-view__playlist-toggle" @click="togglePlaylist(playlist.id)">
              <i class="ti" :class="expandedPlaylistId === playlist.id ? 'ti-chevron-down' : 'ti-chevron-right'" aria-hidden="true" />
              <span class="albums-view__playlist-name">
                <strong>{{ playlist.name }}</strong>
                <small>{{ playlist.items.length }} faixa(s)</small>
              </span>
            </button>
            <div class="albums-view__playlist-actions">
              <v-btn size="x-small" color="primary" variant="tonal" :disabled="playlist.items.length === 0" @click="playPlaylist(playlist)">
                <i class="ti ti-player-play" aria-hidden="true" /> Tocar
              </v-btn>
              <v-btn size="x-small" icon="mdi-trash-can-outline" variant="text" color="error" :aria-label="`Remover playlist ${playlist.name}`" @click="removePlaylist(playlist.id)" />
            </div>
          </div>
          <ul v-if="expandedPlaylistId === playlist.id && playlist.items.length > 0" class="albums-view__playlist-tracks">
            <li v-for="(item, index) in playlist.items" :key="`${item.musicId}-${index}`">
              <span>{{ index + 1 }}. {{ item.title }}</span>
              <v-btn size="x-small" icon="mdi-close" variant="text" :aria-label="`Remover ${item.title}`" @click="removePlaylistTrack(playlist.id, index)" />
            </li>
          </ul>
        </article>
      </div>
    </section>

    <div
      v-if="lastActionMessageKey && !lastActionMessageKey.startsWith('media.messages.')"
      class="albums-view__alert"
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
      v-if="lastErrorKey && !isHubSearching"
      class="albums-view__alert"
      role="alert"
    >
      <p>{{ t(lastErrorKey) }}</p>
      <button
        type="button"
        @click="retry"
      >
        {{ t('albums.retry') }}
      </button>
    </div>

    <template v-else-if="isHubSearching">
      <GlassCard
        class="albums-view__results-card"
        :padding="false"
        elevated
      >
        <div class="albums-view__results-head">
          <h2 class="albums-view__results-title">
            {{ t('albums.searchResultsTitle') }}
          </h2>
        </div>

        <div
          v-if="isLoadingMusicIndex"
          class="albums-view__state albums-view__state--inset"
        >
          {{ t('albums.loading') }}
        </div>

        <div
          v-else-if="hubSearchResults.length === 0"
          class="albums-view__state albums-view__state--inset"
        >
          {{ t('albums.messages.searchEmpty') }}
        </div>

        <div
          v-else
          class="albums-view__results-list"
        >
          <AlbumSearchHitRow
            v-for="hit in hubSearchResults"
            :key="hit.musicId"
            :hit="hit"
            :busy="busyMusicId === hit.musicId"
            @sung="runAction(hit.musicId, () => playSung(hit.musicId))"
            @instrumental="
              runAction(hit.musicId, () => playInstrumental(hit.musicId))
            "
            @slides="runAction(hit.musicId, () => playSlides(hit.musicId))"
            @lyric="runAction(hit.musicId, () => openLyric(hit.musicId))"
          />
        </div>
      </GlassCard>
    </template>

    <div
      v-else-if="isLoadingCatalog"
      class="albums-view__state"
    >
      {{ t('albums.loading') }}
    </div>

    <div
      v-else-if="categories.length === 0"
      class="albums-view__state"
    >
      {{ t('albums.messages.catalogEmpty') }}
    </div>

    <div
      v-else
      class="albums-view__body"
    >
      <section
        v-for="category in categories"
        :key="String(category.id)"
        class="albums-view__category"
        :class="{
          'albums-view__category--hymnals': isHymnalsCategory(category),
        }"
      >
        <header class="albums-view__category-header">
          <h2 class="albums-view__category-title">
            {{ categoryTitle(category) }}
          </h2>
          <p class="albums-view__category-subtitle">
            {{ categorySubtitle(category) }}
          </p>
        </header>

        <div
          v-if="isHymnalsCategory(category)"
          class="albums-view__hymnal-grid"
        >
          <AlbumHymnalCard
            v-for="collection in category.collections"
            :key="String(collection.id)"
            :collection="collection"
            @open="openCollection(collection.id)"
          />
        </div>

        <GlassCard
          v-else
          class="albums-view__grid-wrap"
          :padding="false"
          elevated
        >
          <div class="albums-view__grid">
            <AlbumCollectionCard
              v-for="collection in category.collections"
              :key="String(collection.id)"
              :collection="collection"
              @open="openCollection(collection.id)"
            />
          </div>
        </GlassCard>
      </section>
    </div>

    <AlbumLyricDialog
      :open="lyricOpen"
      :loading="isLoadingLyric"
      :document="lyricDoc"
      @close="closeLyric"
    />
  </section>
</template>

<style scoped lang="scss">
.albums-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  container-type: inline-size;
  container-name: albums-view;
}

.albums-view__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.albums-view__brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.albums-view__icon {
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
    font-size: 1.4rem;
  }
}

.albums-view__headings {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;
}

.albums-view__title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.15;
}

.albums-view__subtitle {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ds-color-primary);
}

.albums-view__header-actions {
  display: flex;
  flex-shrink: 1;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
}

.albums-view__search {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 14rem;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 1;
  box-sizing: border-box;
  padding: 0.55rem 0.9rem;
  border-radius: var(--ds-radius-lg, 16px 0 16px 0);
  background: color-mix(in srgb, var(--ds-color-surface-card) 82%, transparent);
  border: 1px solid var(--ds-color-outline-strong);
  color: var(--ds-color-on-surface-variant);

  .ti-search {
    flex-shrink: 0;
    color: var(--ds-color-primary);
    font-size: 1.15rem;
  }

  input {
    flex: 1;
    min-width: 0;
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: var(--ds-color-on-surface);
    font-size: 0.9rem;
  }
}

.albums-view__search-clear {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--ds-color-on-surface-variant);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--ds-color-primary);
    background: color-mix(in srgb, var(--ds-color-primary) 14%, transparent);
  }
}

.albums-view__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-right: 0.25rem;
}

.albums-view__category-header {
  margin-bottom: 1rem;
}

.albums-view__category-title {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ds-color-on-surface);
}

.albums-view__category-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ds-color-on-surface-variant);
  opacity: 0.85;
}

.albums-view__hymnal-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.albums-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.albums-view__results-card {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.albums-view__results-head {
  flex-shrink: 0;
  padding: 0.9rem 1rem 0.55rem;
  border-bottom: 1px solid var(--ds-color-outline);
}

.albums-view__results-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ds-color-on-surface);
}

.albums-view__results-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.albums-view__state,
.albums-view__alert {
  flex: 1;
  min-height: 0;
  border-radius: var(--ds-radius-lg, 1rem 0 1rem 0);
  background: color-mix(in srgb, var(--ds-color-surface-card) 72%, transparent);
  border: 1px solid var(--ds-color-outline-strong);
  padding: 1.5rem;
  color: var(--ds-color-on-surface-variant);
}

.albums-view__state--inset {
  flex: 1;
  border: none;
  border-radius: 0;
  background: transparent;
}

.albums-view__alert {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  button {
    border: 1px solid var(--ds-color-outline-strong);
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    background: transparent;
    color: var(--ds-color-on-surface);
    cursor: pointer;
  }
}

@media (max-width: 1280px) {
  .albums-view {
    gap: 0.85rem;
    padding: 0.5rem 1rem 0.65rem;
  }

  .albums-view__header {
    gap: 0.75rem;
  }

  .albums-view__brand {
    gap: 0.65rem;
  }

  .albums-view__icon {
    width: 2.25rem;
    height: 2.25rem;

    .ti {
      font-size: 1.15rem;
    }
  }

  .albums-view__title {
    font-size: 1.15rem;
  }

  .albums-view__subtitle {
    font-size: 0.85rem;
  }

  .albums-view__body {
    gap: 1.15rem;
  }

  .albums-view__category-header {
    margin-bottom: 0.65rem;
  }

  .albums-view__category-title {
    font-size: 1.05rem;
  }

  .albums-view__hymnal-grid {
    gap: 0.85rem;
  }

  .albums-view__grid {
    gap: 0.75rem;
    padding: 0.75rem;
  }
}
</style>
.albums-view__playlists {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.albums-view__playlists-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.albums-view__playlists-header h2 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.02rem;
}

.albums-view__playlists-header form {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.albums-view__playlists-header input {
  min-width: 14rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba(125, 137, 155, 0.4);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.88rem;
}

.albums-view__playlists-empty {
  padding: 0.9rem;
  color: rgba(125, 137, 155, 1);
  font-size: 0.88rem;
  border: 1px dashed rgba(125, 137, 155, 0.4);
  border-radius: 8px;
}

.albums-view__playlists-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.albums-view__playlist {
  border: 1px solid rgba(125, 137, 155, 0.25);
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
}

.albums-view__playlist-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.albums-view__playlist-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
}

.albums-view__playlist-name {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.albums-view__playlist-name small {
  color: rgba(125, 137, 155, 1);
  font-size: 0.76rem;
}

.albums-view__playlist-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.albums-view__playlist-tracks {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.albums-view__playlist-tracks li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
  font-size: 0.85rem;
  border-top: 1px solid rgba(125, 137, 155, 0.15);
}
