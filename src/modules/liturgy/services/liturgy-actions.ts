import { useBibleStore } from '@modules/bible/stores/useBibleStore'
import { openMusicPlayer } from '@modules/media/services/open-music-player'
import type { MediaPlaybackMode } from '@modules/media/types/media'
import type { Router } from 'vue-router'

import type { LiturgyItem } from '../types/liturgy'
import { INTERNAL_FILE_TYPES } from '../types/liturgy'
import { isExecutableItem } from './liturgy-item-helpers'
import { isBrowsableMediaUrl } from './liturgy-web-runtime'
import {
  openLiturgyLocalImageControl,
  openLiturgyLocalPdfControl,
  openLiturgyLocalVideoControl,
  openLiturgySiteControl,
  openLiturgySiteOnScreens,
  openLiturgyVideoControl,
  playLiturgyLocalImageOnScreens,
  playLiturgyLocalPdfOnScreens,
  playLiturgyLocalVideoOnScreens,
  playLiturgyWebOnConfiguredScreens,
} from './liturgy-web-projection'

const FAIL_DESKTOP: LiturgyActionResult = { ok: false, messageKey: 'liturgy.messages.mediaDesktopOnly' }
const FAIL_PROJECTION: LiturgyActionResult = { ok: false, messageKey: 'liturgy.messages.projectionFailed' }
const FAIL_URL: LiturgyActionResult = { ok: false, messageKey: 'liturgy.messages.urlMissing' }

function labelOrFallback(item: LiturgyItem, fallback: string): string {
  return item.name?.trim() || fallback
}

function requireBrowsableFile(filePath: string | undefined | null): LiturgyActionResult | null {
  const trimmed = filePath?.trim()
  if (!trimmed || !isBrowsableMediaUrl(trimmed)) return FAIL_DESKTOP
  return null
}

async function tryOpenOnScreens(
  fn: () => Promise<boolean>,
): Promise<LiturgyActionResult> {
  return (await fn()) ? { ok: true } : FAIL_PROJECTION
}

function extractUrl(item: LiturgyItem): string | null {
  return item.url?.trim() || null
}

export type LiturgyActionResult =
  | { ok: true; messageKey?: string }
  | { ok: false; messageKey: string }

function resolveMusicId(item: LiturgyItem): number | null {
  if (item.type !== 'music') return null
  const musicId = Number(item.musicId)
  if (!Number.isFinite(musicId) || musicId <= 0) return null
  return musicId
}

function resolveImagePaths(item: LiturgyItem): string[] {
  if (item.type !== 'images') return []
  if (item.filePaths && item.filePaths.length > 0) {
    return item.filePaths.map((entry) => entry.trim()).filter(Boolean)
  }
  const single = item.filePath?.trim()
  return single ? [single] : []
}

function hasBrowsableMedia(paths: string[]): boolean {
  return paths.some((path) => isBrowsableMediaUrl(path))
}

/** Abre a música no player padrão — exatamente o mesmo contrato dos Álbuns. */
export async function openLiturgyMusicPlayer(
  item: LiturgyItem,
  mode: MediaPlaybackMode,
  options?: { project?: boolean },
): Promise<LiturgyActionResult> {
  const musicId = resolveMusicId(item)
  if (musicId == null) {
    return { ok: false, messageKey: 'liturgy.messages.catalogEmpty' }
  }

  const result = await openMusicPlayer({
    musicId,
    mode,
    project: options?.project,
  })

  if (!result.ok) {
    return { ok: false, messageKey: result.messageKey }
  }

  return { ok: true, messageKey: result.warningKey }
}

/** Abre música no player e projeta nas telas (fluxo legado do clique único). */
export async function openLiturgyMusicOnScreens(
  item: LiturgyItem,
): Promise<LiturgyActionResult> {
  return openLiturgyMusicPlayer(item, item.musicMode ?? 'audio', {
    project: true,
  })
}

/** Abre o item (música já projeta nas telas configuradas). */
async function executeVerseItem(item: LiturgyItem, router: Router): Promise<LiturgyActionResult> {
  if (item.verseBookId == null || item.verseChapter == null) return { ok: true }

  const bibleStore = useBibleStore()
  if (bibleStore.books.length === 0) await bibleStore.bootstrap()
  await bibleStore.selectBook(item.verseBookId)
  await bibleStore.selectChapter(item.verseChapter)

  const verseQuery = item.verseNumbers?.trim()
  if (verseQuery) {
    bibleStore.verseSearchQuery = verseQuery
    bibleStore.applyVerseSearch()
  }

  await router.push({ name: 'bible' })
  return { ok: true }
}

async function executeFileItem(
  item: LiturgyItem,
  type: 'video' | 'images' | 'pdf',
): Promise<LiturgyActionResult> {
  const filePath = item.filePath?.trim()
  if (!filePath) return FAIL_DESKTOP

  if (type === 'video' || type === 'pdf') {
    const check = requireBrowsableFile(filePath)
    if (check) return check
    const openFn = type === 'video' ? openLiturgyLocalVideoControl : openLiturgyLocalPdfControl
    return tryOpenOnScreens(() => openFn(filePath, labelOrFallback(item, filePath)))
  }

  const paths = resolveImagePaths(item)
  if (!hasBrowsableMedia(paths)) return FAIL_DESKTOP
  return tryOpenOnScreens(() =>
    openLiturgyLocalImageControl(paths, labelOrFallback(item, paths[0] || 'Imagens')),
  )
}

async function executeUrlItem(
  item: LiturgyItem,
  type: 'online_video' | 'site',
): Promise<LiturgyActionResult> {
  const url = extractUrl(item)
  if (!url) return FAIL_URL
  const openFn = type === 'site' ? openLiturgySiteControl : openLiturgyVideoControl
  return tryOpenOnScreens(() => openFn(url, labelOrFallback(item, url)))
}

export async function executeLiturgyItem(
  item: LiturgyItem,
  router: Router,
): Promise<LiturgyActionResult> {
  if (!isExecutableItem(item)) return { ok: true }

  switch (item.type) {
    case 'music': {
      const result = await openLiturgyMusicOnScreens(item)
      if (result.ok) await router.push({ name: 'media' })
      return result
    }
    case 'verse':
      return executeVerseItem(item, router)
    case 'online_video':
      return executeUrlItem(item, 'online_video')
    case 'video':
    case 'pdf':
    case 'images':
      return executeFileItem(item, item.type as 'video' | 'images' | 'pdf')
    case 'presentation':
      return item.filePath?.trim()
        ? { ok: false, messageKey: 'liturgy.messages.presentationWebUnsupported' }
        : FAIL_DESKTOP
    case 'site':
      return executeUrlItem(item, 'site')
    default:
      return INTERNAL_FILE_TYPES.includes(item.type) ? FAIL_DESKTOP : { ok: true }
  }
}

/** Abre o controle (se preciso) e dá play — telas (popups) seguem. */
async function playFileOnScreens(
  item: LiturgyItem,
  type: 'video' | 'images' | 'pdf',
): Promise<LiturgyActionResult> {
  if (type === 'images') {
    const paths = resolveImagePaths(item)
    if (!hasBrowsableMedia(paths)) return FAIL_DESKTOP
    return tryOpenOnScreens(() =>
      playLiturgyLocalImageOnScreens(paths, labelOrFallback(item, paths[0] || 'Imagens')),
    )
  }

  const check = requireBrowsableFile(item.filePath)
  if (check) return check
  const playFn =
    type === 'video' ? playLiturgyLocalVideoOnScreens : playLiturgyLocalPdfOnScreens
  return tryOpenOnScreens(() => playFn(item.filePath!.trim(), labelOrFallback(item, item.filePath!.trim())))
}

export async function playLiturgyItemOnScreens(
  item: LiturgyItem,
): Promise<LiturgyActionResult> {
  switch (item.type) {
    case 'music':
      return openLiturgyMusicOnScreens(item)
    case 'video':
    case 'images':
    case 'pdf':
      return playFileOnScreens(item, item.type as 'video' | 'images' | 'pdf')
    case 'presentation':
      return item.filePath?.trim()
        ? { ok: false, messageKey: 'liturgy.messages.presentationWebUnsupported' }
        : FAIL_DESKTOP
    case 'online_video':
    case 'site': {
      const url = extractUrl(item)
      if (!url) return FAIL_URL
      const playFn = item.type === 'site' ? openLiturgySiteOnScreens : playLiturgyWebOnConfiguredScreens
      return tryOpenOnScreens(() => playFn(url, labelOrFallback(item, url)))
    }
    default:
      return { ok: true }
  }
}