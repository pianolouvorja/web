import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { openMusicPlayer } from '@modules/media/services/open-music-player'
import type { MediaPlaybackMode } from '@modules/media/types/media'

import {
  fromCustomCollectionId,
  fromCustomMusicId,
  isCustomCollectionId,
    isCustomMusicId,
    enrichDurations,
    listCustomCollections,
    listCustomMusics,
    loadCustomMusicTrack,
    toCustomMusicId,
  } from '@modules/media/services/custom-catalog'

import {
  findCollectionById,
  loadAlbumCategories,
} from '../services/album-catalog'
import { formatCatalogDuration } from '../services/album-tracks'
import {
  filterAlbumMusicIndex,
  loadAlbumMusicIndex,
} from '../services/album-music-search'
import {
  filterAlbumTracks,
  loadAlbumLyric,
  loadCollectionTracks,
} from '../services/album-tracks'
import type {
  AlbumCategory,
  AlbumCollection,
  AlbumLyricDocument,
  AlbumSearchHit,
  AlbumTrack,
} from '../types/albums'

export const useAlbumsStore = defineStore('albums', () => {
  const categories = ref<AlbumCategory[]>([])
  const activeCollection = ref<AlbumCollection | null>(null)
  const tracks = ref<AlbumTrack[]>([])
  const musicIndex = ref<AlbumSearchHit[]>([])
  const searchQuery = ref('')
  const hubSearchQuery = ref('')
  const isLoadingCatalog = ref(false)
  const isLoadingTracks = ref(false)
  const isLoadingMusicIndex = ref(false)
  const lastErrorKey = ref<string | null>(null)
  const lastActionMessageKey = ref<string | null>(null)

  const lyricOpen = ref(false)
  const lyricDoc = ref<AlbumLyricDocument | null>(null)
  const isLoadingLyric = ref(false)

  const filteredTracks = computed(() =>
    filterAlbumTracks(tracks.value, searchQuery.value),
  )

  const hubSearchResults = computed(() =>
    filterAlbumMusicIndex(musicIndex.value, hubSearchQuery.value),
  )

  const isHubSearching = computed(() => hubSearchQuery.value.trim().length > 0)

  async function hydrateMusicIndex() {
    const first = musicIndex.value[0]
    if (
      (musicIndex.value.length > 0 && Array.isArray(first?.hymnalTracks)) ||
      isLoadingMusicIndex.value
    ) {
      return
    }
    isLoadingMusicIndex.value = true
    try {
      musicIndex.value = await loadAlbumMusicIndex()
    } catch (error) {
      console.error('[albums] falha ao carregar índice de músicas', error)
      musicIndex.value = []
    } finally {
      isLoadingMusicIndex.value = false
    }
  }

  async function hydrateCatalog() {
    if (categories.value.length > 0) return
    isLoadingCatalog.value = true
    lastErrorKey.value = null
    try {
      categories.value = await loadAlbumCategories()
      if (categories.value.length === 0) {
        lastErrorKey.value = 'albums.messages.catalogEmpty'
      }
      void hydrateMusicIndex()
    } catch (error) {
      console.error('[albums] falha ao carregar catálogo', error)
      lastErrorKey.value = 'albums.messages.catalogFailed'
      categories.value = []
    } finally {
      isLoadingCatalog.value = false
    }
  }

  async function openCollection(collectionId: string) {
    isLoadingTracks.value = true
    lastErrorKey.value = null
    searchQuery.value = ''
    tracks.value = []

    try {
      // Minhas Coletâneas (custom): rota albums/2xxxxxx (offset 2M), sem catálogo oficial
      if (isCustomCollectionId(collectionId)) {
        const customId = fromCustomCollectionId(collectionId)
        const summaries = await listCustomCollections()
        const summary = summaries.find((item) => item.id === customId)
        if (!summary) {
          activeCollection.value = null
          lastErrorKey.value = 'albums.messages.collectionMissing'
          return false
        }
        activeCollection.value = {
          id: collectionId,
          kind: 'album',
          name: summary.name,
          subtitle: summary.description ?? '',
          coverUrl: null,
          trackCount: summary.musicsCount,
          catalogKey: `custom_collection_${customId}`,
        }
        const musics = await listCustomMusics(customId)
        tracks.value = musics.map((music, index) => ({
          musicId: toCustomMusicId(music.id),
          name: music.name,
          track: index + 1,
          durationLabel: formatCustomDuration(music.duration),
          hasInstrumental: false,
        }))
        // API não traz duração: probeAudioDuration lê metadata do MP3 em bg.
        // Quando completar, re-atribui tracks p/ Vue re-renderizar com m:ss.
        void enrichDurations(musics).then((enriched) => {
          if (!enriched || tracks.value.length !== musics.length) return
          tracks.value = musics.map((music, index) => ({
            musicId: toCustomMusicId(music.id),
            name: music.name,
            track: index + 1,
            durationLabel: formatCustomDuration(music.duration),
            hasInstrumental: false,
          }))
        })
        if (tracks.value.length === 0) {
          lastErrorKey.value = 'albums.messages.tracksEmpty'
        }
        return true
      }

      if (categories.value.length === 0) {
        await hydrateCatalog()
      }

      const collection = findCollectionById(categories.value, collectionId)
      if (!collection) {
        activeCollection.value = null
        lastErrorKey.value = 'albums.messages.collectionMissing'
        return false
      }

      activeCollection.value = collection
      tracks.value = await loadCollectionTracks(collection)
      if (tracks.value.length === 0) {
        lastErrorKey.value = 'albums.messages.tracksEmpty'
      }
      return true
    } catch (error) {
      console.error('[albums] falha ao carregar faixas', error)
      lastErrorKey.value = 'albums.messages.tracksFailed'
      activeCollection.value = null
      tracks.value = []
      return false
    } finally {
      isLoadingTracks.value = false
    }
  }

  function clearCollection() {
    activeCollection.value = null
    tracks.value = []
    searchQuery.value = ''
  }

  /** Duração custom (segundos inteiros da API custom) em m:ss; null → '—'. */
  function formatCustomDuration(duration: number | null): string {
    return formatCatalogDuration(duration)
  }

  /** Documento de letra de música custom (Minhas Coletâneas). */
  async function loadCustomLyricDocument(
    customMusicId: number,
  ): Promise<AlbumLyricDocument | null> {
    const track = await loadCustomMusicTrack(customMusicId)
    if (!track) return null
    const lines = track.lyrics
      .filter((slide) => slide.showSlide && slide.lyric.trim().length > 0)
      .map((slide) => ({
        order: slide.order,
        text: slide.lyric
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[a-zA-Z][^>]*>/g, '')
          .trim(),
      }))
      .filter((line) => line.text.length > 0)
    return {
      musicId: track.id,
      title: track.name,
      lines,
    }
  }

  function clearError() {
    lastErrorKey.value = null
  }

  function clearActionMessage() {
    lastActionMessageKey.value = null
  }

  async function playTrack(
    musicId: number,
    mode: MediaPlaybackMode,
    options?: { project?: boolean },
  ) {
    // Música custom (Minhas Coletâneas): sem albumId do catálogo oficial;
    // o playback resolve pela API custom via resolveMediaTrack.
    const albumId = isCustomMusicId(musicId)
      ? null
      : activeCollection.value?.kind === 'album'
        ? Number(activeCollection.value.id)
        : null

    const result = await openMusicPlayer({
      musicId,
      mode,
      albumId: Number.isFinite(albumId) ? albumId : null,
      project: options?.project,
    })

    if (!result.ok) {
      lastActionMessageKey.value = result.messageKey
      return false
    }

    lastActionMessageKey.value = result.warningKey ?? null
    return true
  }

  async function openLyric(musicId: number) {
    isLoadingLyric.value = true
    lyricDoc.value = null
    lyricOpen.value = true
    try {
      lyricDoc.value = isCustomMusicId(musicId)
        ? await loadCustomLyricDocument(fromCustomMusicId(musicId))
        : await loadAlbumLyric(musicId)
      if (!lyricDoc.value) {
        lastActionMessageKey.value = 'albums.messages.lyricMissing'
        lyricOpen.value = false
      }
    } catch (error) {
      console.error('[albums] falha ao carregar letra', error)
      lastActionMessageKey.value = 'albums.messages.lyricMissing'
      lyricOpen.value = false
    } finally {
      isLoadingLyric.value = false
    }
  }

  function closeLyric() {
    lyricOpen.value = false
    lyricDoc.value = null
  }

  return {
    categories,
    activeCollection,
    tracks,
    musicIndex,
    searchQuery,
    hubSearchQuery,
    isLoadingCatalog,
    isLoadingTracks,
    isLoadingMusicIndex,
    lastErrorKey,
    lastActionMessageKey,
    lyricOpen,
    lyricDoc,
    isLoadingLyric,
    filteredTracks,
    hubSearchResults,
    isHubSearching,
    hydrateCatalog,
    hydrateMusicIndex,
    openCollection,
    clearCollection,
    clearError,
    clearActionMessage,
    playTrack,
    openLyric,
    closeLyric,
  }
})
