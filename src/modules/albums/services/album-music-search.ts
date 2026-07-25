import type { AlbumSearchHit } from '../types/albums'
import { formatCatalogDuration } from './album-tracks'
import { readOrFetchCatalogJson } from '@shared/services/remote-catalog'

type CatalogMusicAlbum = {
  id_album?: number | string
  name?: string
  track?: number | string | null
  type?: string
  pivot?: {
    track?: number | string | null
  } | null
}

type CatalogMusicIndexRow = {
  id_music?: number | string
  name?: string
  track?: number | string | null
  duration?: number | string | null
  has_instrumental_music?: number | string | boolean | null
  url_instrumental_music?: string | null
  albums?: CatalogMusicAlbum[]
  albums_names?: string
}

async function readOrFetchCatalog<T>(filename: string): Promise<T | null> {
  return readOrFetchCatalogJson<T>(filename)
}

function asNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function hasInstrumentalFlag(row: CatalogMusicIndexRow): boolean {
  if (row.has_instrumental_music === true || row.has_instrumental_music === 1) {
    return true
  }
  if (row.has_instrumental_music === '1') return true
  return Boolean(String(row.url_instrumental_music ?? '').trim())
}

function joinAlbumNames(row: CatalogMusicIndexRow): string {
  const fromField = String(row.albums_names ?? '').trim()
  if (fromField) return fromField
  const fromAlbums = (row.albums ?? [])
    .map((album) => String(album.name ?? '').trim())
    .filter(Boolean)
  return fromAlbums.join(', ')
}

function albumTrackNumber(album: CatalogMusicAlbum): number | null {
  return asNumber(album.pivot?.track ?? album.track)
}

function isHymnalAlbum(album: CatalogMusicAlbum): boolean {
  const type = String(album.type ?? '').toLowerCase()
  if (type === 'hymnal' || type === 'hymnal_1996') return true
  const name = String(album.name ?? '')
  return name.includes('Hinário Adventista')
}

function collectHymnalTracks(row: CatalogMusicIndexRow): number[] {
  const tracks: number[] = []
  for (const album of row.albums ?? []) {
    if (!isHymnalAlbum(album)) continue
    const track = albumTrackNumber(album)
    if (track != null && track > 0) tracks.push(track)
  }
  return tracks
}

function preferredHymnalTrack(
  row: CatalogMusicIndexRow,
  hymnalTracks: number[],
): { track: number | null; isHymnal: boolean } {
  // Preferência: Hinário atual → 1996 → qualquer.
  for (const album of row.albums ?? []) {
    if (!isHymnalAlbum(album)) continue
    const name = String(album.name ?? '')
    if (name.includes('Hinário Adventista') && !name.includes('1996')) {
      const track = albumTrackNumber(album)
      if (track != null && track > 0) return { track, isHymnal: true }
    }
  }
  for (const album of row.albums ?? []) {
    if (!isHymnalAlbum(album)) continue
    const track = albumTrackNumber(album)
    if (track != null && track > 0) return { track, isHymnal: true }
  }

  if (hymnalTracks[0] != null) {
    return { track: hymnalTracks[0], isHymnal: true }
  }

  const albumNames = joinAlbumNames(row)
  const looksHymnal = albumNames.includes('Hinário Adventista')
  const fallback = asNumber(row.track)
  if (looksHymnal && fallback != null && fallback > 0) {
    return { track: fallback, isHymnal: true }
  }

  return { track: null, isHymnal: false }
}

function mapMusicIndexRow(row: CatalogMusicIndexRow): AlbumSearchHit | null {
  const musicId = asNumber(row.id_music)
  if (musicId == null || musicId <= 0) return null

  const name = String(row.name ?? '').trim()
  if (!name) return null

  const hymnalTracks = collectHymnalTracks(row)
  const { track, isHymnal } = preferredHymnalTrack(row, hymnalTracks)
  const albumNames = joinAlbumNames(row) || 'Música'

  return {
    musicId,
    name,
    track,
    durationLabel: formatCatalogDuration(row.duration),
    hasInstrumental: hasInstrumentalFlag(row),
    albumNames,
    displayTitle: name,
    isHymnal,
    hymnalTracks: [...new Set(hymnalTracks)],
  }
}

function mergeHits(a: AlbumSearchHit, b: AlbumSearchHit): AlbumSearchHit {
  const hymnalTracks = [...new Set([...a.hymnalTracks, ...b.hymnalTracks])]
  const track = a.track ?? b.track ?? hymnalTracks[0] ?? null
  return {
    ...a,
    track,
    isHymnal: a.isHymnal || b.isHymnal || track != null,
    albumNames: a.albumNames.includes(b.albumNames)
      ? a.albumNames
      : [a.albumNames, b.albumNames].filter(Boolean).join(', '),
    hasInstrumental: a.hasInstrumental || b.hasInstrumental,
    hymnalTracks,
  }
}

/** Carrega o índice global de músicas (`pt_musics`). */
export async function loadAlbumMusicIndex(): Promise<AlbumSearchHit[]> {
  const rows = await readOrFetchCatalog<CatalogMusicIndexRow[]>('pt_musics')
  if (!Array.isArray(rows) || rows.length === 0) return []

  const byId = new Map<number, AlbumSearchHit>()
  for (const row of rows) {
    const mapped = mapMusicIndexRow(row)
    if (!mapped) continue
    const existing = byId.get(mapped.musicId)
    byId.set(
      mapped.musicId,
      existing ? mergeHits(existing, mapped) : mapped,
    )
  }

  return [...byId.values()]
}

/**
 * Busca estilo Home legado: nome, álbum ou número do hinário (máx. 50).
 * Número prioriza Hinário Adventista atual, depois 1996.
 */
function hasHymnalNumber(entry: AlbumSearchHit, num: number): boolean {
  return entry.track === num || (entry.hymnalTracks ?? []).includes(num)
}

function hymnalSortScore(entry: AlbumSearchHit, num: number): number {
  if (!hasHymnalNumber(entry, num)) return 0
  if (entry.albumNames.includes('Hinário Adventista') && !entry.albumNames.includes('1996')) return 2
  if (entry.albumNames.includes('Hinário Adventista 1996')) return 1
  return 0
}

function normalizeTrackNumber(entry: AlbumSearchHit, num: number): AlbumSearchHit {
  if (!hasHymnalNumber(entry, num)) return entry
  return { ...entry, track: num, isHymnal: true }
}

export function filterAlbumMusicIndex(
  index: AlbumSearchHit[],
  query: string,
): AlbumSearchHit[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const isNum = /^\d+$/.test(trimmed)
  const numQuery = isNum ? Number(trimmed) : null

  const matchesQuery = (entry: AlbumSearchHit) => {
    const title = entry.name.toLowerCase()
    const album = entry.albumNames.toLowerCase()
    return (
      title.includes(trimmed) ||
      album.includes(trimmed) ||
      (isNum && numQuery != null && hasHymnalNumber(entry, numQuery))
    )
  }

  let results = index.filter(matchesQuery)

  if (isNum && numQuery != null) {
    results = results
      .map((e) => normalizeTrackNumber(e, numQuery))
      .sort((a, b) => hymnalSortScore(b, numQuery) - hymnalSortScore(a, numQuery))
  }

  return results.slice(0, 50)
}