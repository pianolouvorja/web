import { readOrFetchCatalogJson } from '@shared/services/remote-catalog'

import type {
  BibleBook,
  BibleBookTone,
  BibleChapterVerses,
  BibleTestament,
  BibleVersion,
  CatalogBibleBookRow,
  CatalogBibleVersionRow,
} from '../types/bible'

const BOOKS_FILE = 'pt_bible_book'
const VERSIONS_FILE = 'pt_bible_version'

function mapBook(row: CatalogBibleBookRow): BibleBook {
  return {
    id: Number(row.id_bible_book),
    name: String(row.name),
    abbreviation: String(row.abbreviation),
    chapters: Number(row.chapters) || 0,
    bookNumber: Number(row.book_number) || 0,
    languageId: String(row.id_language ?? 'pt'),
  }
}

function mapVersion(row: CatalogBibleVersionRow): BibleVersion {
  return {
    id: Number(row.id_bible_version),
    abbreviation: String(row.abbreviation),
    name: String(row.name),
    languageId: String(row.id_language ?? 'pt'),
  }
}

export function resolveTestament(bookNumber: number): BibleTestament {
  return bookNumber <= 39 ? 'ot' : 'nt'
}

/** Tom visual do tile conforme faixas canônicas. OT = quente/terroso, NT = frio/espiritual. */
export function resolveBookTone(bookNumber: number): BibleBookTone {
  // Antigo Testamento (1-39)
  if (bookNumber <= 5) return 'law'         // Gênesis–Deuteronômio
  if (bookNumber <= 17) return 'history'    // Josué–Ester
  if (bookNumber <= 39) return 'prophets'   // Jó–Malaquias
  // Novo Testamento (40-66)
  if (bookNumber <= 43) return 'gospels'    // Mateus–João
  if (bookNumber === 44) return 'acts'      // Atos
  if (bookNumber <= 57) return 'pauline'    // Romanos–Hebreus
  if (bookNumber <= 65) return 'general'    // Tiago–Judas
  if (bookNumber === 66) return 'apocalyptic' // Apocalipse
  return 'neutral'
}

export function chapterRecordKey(
  versionId: number,
  bookId: number,
  chapter: number,
): string {
  return `bible_${versionId}_${bookId}_${chapter}`
}

export async function loadBibleBooks(): Promise<BibleBook[]> {
  const rows = await readOrFetchCatalogJson<CatalogBibleBookRow[]>(BOOKS_FILE)
  if (!rows || !Array.isArray(rows)) return []
  return rows.map(mapBook)
}

export async function loadBibleVersions(): Promise<BibleVersion[]> {
  const rows = await readOrFetchCatalogJson<CatalogBibleVersionRow[]>(VERSIONS_FILE)
  if (!rows || !Array.isArray(rows)) return []
  return rows.map(mapVersion)
}

export async function loadChapterVerses(
  versionId: number,
  bookId: number,
  chapter: number,
): Promise<BibleChapterVerses> {
  const key = chapterRecordKey(versionId, bookId, chapter)
  const verses = await readOrFetchCatalogJson<BibleChapterVerses>(key)
  if (!verses || typeof verses !== 'object') return {}
  return verses
}

/** Preferência padrão: ARA, senão a primeira versão. */
export function pickDefaultVersionId(
  versions: BibleVersion[],
  savedId: number | null,
): number | null {
  if (versions.length === 0) return null

  if (savedId != null && versions.some((version) => version.id === savedId)) {
    return savedId
  }

  const ara = versions.find(
    (version) =>
      version.abbreviation.toUpperCase() === 'ARA' ||
      version.name.toUpperCase() === 'ARA',
  )
  return ara?.id ?? versions[0].id
}
