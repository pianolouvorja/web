import type {
  MediaLyricSlide,
  MediaTrackRecord,
} from '../types/media'

import { loadMediaTrack } from './media-catalog'

/**
 * Catálogo de músicas customizadas (Minhas Coletâneas) via API /v1/custom
 *
 * Formato de resposta do GET /v1/custom/musics/{id}:
 * { id_music, id_collection, name, lyric, auxiliary_lyric,
 *   audio_url, instrumental_url, image_url, image_position,
 *   lyrics: [{ id_lyric, lyric, aux_lyric, image_url, image_position,
 *              time, instrumental_time, show_slide, order }] }
 */

/**
 * Namespace de IDs: custom_musics.id_music e custom_collections.id_collection
 * são AUTOINCREMENT próprios (1, 2, 3...) e colidem com music_{id} do catálogo
 * oficial (1..90167). Na Central de Mídia usamos IDs deslocados:
 * - música custom = id_music + CUSTOM_MUSIC_ID_OFFSET (1.000.000+)
 * - coletânea custom = id_collection + CUSTOM_COLLECTION_ID_OFFSET (2.000.000+)
 * O dispatcher resolveMediaTrack() usa o offset para escolher o loader certo.
 */
export const CUSTOM_MUSIC_ID_OFFSET = 1_000_000
export const CUSTOM_COLLECTION_ID_OFFSET = 2_000_000

export function isCustomMusicId(musicId: number): boolean {
  return Number.isFinite(musicId) && musicId >= CUSTOM_MUSIC_ID_OFFSET
}

export function toCustomMusicId(musicId: number): number {
  return musicId + CUSTOM_MUSIC_ID_OFFSET
}

export function fromCustomMusicId(musicId: number): number {
  return musicId - CUSTOM_MUSIC_ID_OFFSET
}

export function isCustomCollectionId(collectionId: number | string): boolean {
  const n = Number(collectionId)
  return Number.isFinite(n) && n >= CUSTOM_COLLECTION_ID_OFFSET
}

export function toCustomCollectionId(collectionId: number): number {
  return collectionId + CUSTOM_COLLECTION_ID_OFFSET
}

export function fromCustomCollectionId(collectionId: number | string): number {
  return Number(collectionId) - CUSTOM_COLLECTION_ID_OFFSET
}

type CustomLyricRow = {
  lyric?: string
  aux_lyric?: string | null
  image_url?: string | null
  image_position?: string | number | null
  time?: string
  instrumental_time?: string
  show_slide?: number | string | boolean
  order?: number | string
}

type CustomMusicRow = {
  id_music?: number
  id_collection?: number
  name?: string
  lyric?: string | null
  auxiliary_lyric?: string | null
  audio_url?: string | null
  instrumental_url?: string | null
  image_url?: string | null
  image_position?: string | number | null
  duration?: number | null
  lyrics?: CustomLyricRow[]
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseShowSlide(value: unknown): boolean {
  if (value === false || value === 0 || value === '0') return false
  return true
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeTime(value: unknown): string {
  const s = asNullableString(value)
  if (!s) return '00:00:00'
  // API retorna HH:MM ou HH:MM:SS — normalizar para HH:MM:SS
  const parts = s.split(':')
  if (parts.length === 2) return `${s}:00`
  return s
}

function mapCustomLyrics(raw: CustomLyricRow[]): MediaLyricSlide[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row, index) => ({
      order: asNumber(row.order, index + 1),
      lyric: asNullableString(row.lyric) ?? '',
      auxLyric: asNullableString(row.aux_lyric),
      showSlide: parseShowSlide(row.show_slide),
      time: normalizeTime(row.time),
      instrumentalTime: normalizeTime(row.instrumental_time),
      imageUrl: asNullableString(row.image_url),
      imagePosition: row.image_position != null ? String(row.image_position) : null,
      isCover: index === 0,
    }))
    .sort((a, b) => a.order - b.order)
}

function customBaseUrl(): string {
  const base = import.meta.env.VITE_PALCO_API_URL
  if (base) return `${base.replace(/\/$/, '')}/v1/custom`
  return '/v1/custom'
}

/**
 * Carrega uma música customizada pela API e mapeia para MediaTrackRecord.
 * Retorna null se a API não responder ou a música não existir.
 */
export async function loadCustomMusicTrack(
  musicId: number,
): Promise<MediaTrackRecord | null> {
  if (!Number.isFinite(musicId) || musicId <= 0) return null

  try {
    const response = await fetch(`${customBaseUrl()}/musics/${musicId}`)
    if (!response.ok) return null
    const row = (await response.json()) as CustomMusicRow
    if (!row || !row.name) return null

    return {
      id: row.id_music ?? musicId,
      name: row.name,
      durationLabel: row.duration ? `${row.duration}s` : '0:00',
      audioUrl: asNullableString(row.audio_url),
      instrumentalUrl: asNullableString(row.instrumental_url),
      coverUrl: asNullableString(row.image_url),
      coverPosition: row.image_position != null ? String(row.image_position) : null,
      albums: [],
      categories: ['Minhas Coletâneas'],
      lyrics: mapCustomLyrics(row.lyrics ?? []),
    } satisfies MediaTrackRecord
  } catch {
    return null
  }
}

/** Lista coletâneas customizadas (para a Central de Mídia). */
export type CustomCollectionSummary = {
  id: number
  name: string
  description: string | null
  musicsCount: number
}

export async function listCustomCollections(): Promise<
  CustomCollectionSummary[]
> {
  try {
    const response = await fetch(`${customBaseUrl()}/collections`)
    if (!response.ok) return []
    const json = (await response.json()) as {
      data?: Array<{
        id_collection: number
        name: string
        description: string | null
        musics_count?: number
      }>
    }
    return (json.data ?? []).map((row) => ({
      id: row.id_collection,
      name: row.name,
      description: row.description ?? null,
      musicsCount: row.musics_count ?? 0,
    }))
  } catch {
    return []
  }
}

/** Lista músicas de uma coletânea customizada. */
export type CustomMusicSummary = {
  id: number
  name: string
  duration: number | null
  hasAudio: boolean
  hasImage: boolean
}

export async function listCustomMusics(
  collectionId: number,
): Promise<CustomMusicSummary[]> {
  try {
    const response = await fetch(
      `${customBaseUrl()}/collections/${collectionId}/musics`,
    )
    if (!response.ok) return []
    const json = (await response.json()) as {
      data?: Array<{
        id_music: number
        name: string
        duration: number | null
        audio_url?: string | null
        image_url?: string | null
      }>
    }
    return (json.data ?? []).map((row) => ({
      id: row.id_music,
      name: row.name,
      duration: row.duration ?? null,
      hasAudio: Boolean(row.audio_url),
      hasImage: Boolean(row.image_url),
    }))
  } catch {
    return []
  }
}

/** CRUD mínimo para o editor web. */
export async function createCustomCollection(
  name: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const response = await fetch(`${customBaseUrl()}/collections`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    if (!response.ok) return null
    const json = (await response.json()) as { id_collection: number }
    return { id: json.id_collection }
  } catch {
    return null
  }
}

export async function createCustomMusic(
  collectionId: number,
  input: { name: string; lyric?: string; auxiliary_lyric?: string },
): Promise<{ id: number } | null> {
  try {
    const response = await fetch(
      `${customBaseUrl()}/collections/${collectionId}/musics`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    )
    if (!response.ok) return null
    const json = (await response.json()) as { id_music: number }
    return { id: json.id_music }
  } catch {
    return null
  }
}

export async function updateCustomMusic(
  musicId: number,
  input: { name?: string; lyric?: string; auxiliary_lyric?: string },
): Promise<boolean> {
  try {
    const response = await fetch(`${customBaseUrl()}/musics/${musicId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function deleteCustomMusic(musicId: number): Promise<boolean> {
  try {
    const response = await fetch(`${customBaseUrl()}/musics/${musicId}`, {
      method: 'DELETE',
    })
    return response.ok
  } catch {
    return false
  }
}

export async function createCustomLyric(
  musicId: number,
  input: {
    lyric: string
    aux_lyric?: string
    time?: string
    order?: number
  },
): Promise<{ id: number } | null> {
  try {
    const response = await fetch(`${customBaseUrl()}/musics/${musicId}/lyrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!response.ok) return null
    const json = (await response.json()) as { id_lyric: number }
    return { id: json.id_lyric }
  } catch {
    return null
  }
}

export async function updateCustomLyric(
  lyricId: number,
  input: {
    lyric?: string
    aux_lyric?: string
    time?: string
    order?: number
  },
): Promise<boolean> {
  try {
    const response = await fetch(`${customBaseUrl()}/lyrics/${lyricId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function deleteCustomLyric(lyricId: number): Promise<boolean> {
  try {
    const response = await fetch(`${customBaseUrl()}/lyrics/${lyricId}`, {
      method: 'DELETE',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Loader composto: resolve um musicId para MediaTrackRecord consultando o
 * catálogo oficial OU a API custom (Minhas Coletâneas), conforme o namespace.
 * IDs >= 1.000.000 são custom; o restante vai ao catálogo JSON oficial.
 * Retorna null quando nenhuma fonte tem a faixa.
 */
export async function resolveMediaTrack(
  musicId: number,
): Promise<MediaTrackRecord | null> {
  if (isCustomMusicId(musicId)) {
    return loadCustomMusicTrack(fromCustomMusicId(musicId))
  }
  return loadMediaTrack(musicId)
}