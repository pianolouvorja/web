export const LITURGY_WEB_RUNTIME_CHANNEL = 'louvorja-liturgy-web-runtime'
export const LITURGY_WEB_RUNTIME_STORAGE_KEY = 'louvorja-liturgy-web-runtime-state'
export const LITURGY_YT_SYNC_CHANNEL = 'louvorja-liturgy-yt-sync'
export const LITURGY_SITE_SYNC_CHANNEL = 'louvorja-liturgy-site-sync'
export const LITURGY_PROJECTING_STORAGE_KEY = 'louvorja-liturgy-projecting-screens'

export type LiturgyWebKind =
  | 'youtube'
  | 'vimeo'
  | 'site'
  | 'video'
  | 'image'
  | 'pdf'

export type LiturgyWebProjectionRuntime = {
  active: boolean
  url: string
  /** URLs extras (galeria de imagens). */
  urls: string[]
  title: string
  kind: LiturgyWebKind
  videoId: string
  /** Epoch ms — todas as telas alinham o início do vídeo a este instante. */
  startedAt: number
  /** Telas de projeção abertas (além do controle). */
  projectingScreens: boolean
}

export type LiturgyYtSyncPayload = {
  videoId: string
  currentTime: number
  isPaused: boolean
  volume: number
  muted: boolean
  updatedAt: number
}

export type LiturgySiteSyncPayload = {
  url: string
  scrollX: number
  scrollY: number
  reloadToken: number
  updatedAt: number
}

export const DEFAULT_LITURGY_WEB_RUNTIME: LiturgyWebProjectionRuntime = {
  active: false,
  url: '',
  urls: [],
  title: '',
  kind: 'site',
  videoId: '',
  startedAt: 0,
  projectingScreens: false,
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => asString(entry).trim()).filter(Boolean)
}

function extractYoutubeId(parsed: URL, host: string): string | null {
  if (host === 'youtu.be') {
    return parsed.pathname.split('/').filter(Boolean)[0] ?? null // NOSONAR
  }

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    return (
      parsed.searchParams.get('v') ||
      parsed.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] || // NOSONAR
      null
    )
  }

  return null
}

export type LiturgyWebTarget = {
  kind: LiturgyWebKind
  url: string
  videoId: string
}

/** Normaliza link para projeção (YouTube/Vimeo/site). */
export function parseLiturgyWebTarget(raw: string): LiturgyWebTarget | null {
  const value = raw.trim()
  if (!value) return null

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const parsed = new URL(withProtocol)
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()

    const youtubeId = extractYoutubeId(parsed, host)
    if (youtubeId) {
      return {
        kind: 'youtube',
        videoId: youtubeId,
        url: `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`,
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop() // NOSONAR
      if (id && /^\d+$/.test(id)) {
        return {
          kind: 'vimeo',
          videoId: id,
          url: `https://vimeo.com/${id}`,
        }
      }
    }

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { kind: 'site', videoId: '', url: withProtocol }
    }

    return null
  } catch {
    return null
  }
}

/** Aceita blob:/data: ou http(s) para mídia local no browser. */
export function isBrowsableMediaUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value) return false
  if (value.startsWith('blob:') || value.startsWith('data:')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** @deprecated Prefer parseLiturgyWebTarget */
export function toProjectionBrowseUrl(raw: string): string | null {
  return parseLiturgyWebTarget(raw)?.url ?? null
}

/** @deprecated Prefer parseLiturgyWebTarget */
export function toProjectionEmbedUrl(raw: string): string | null {
  return parseLiturgyWebTarget(raw)?.url ?? null
}

export function normalizeLiturgyWebRuntime(
  raw: unknown,
): LiturgyWebProjectionRuntime {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_LITURGY_WEB_RUNTIME }
  }

  const source = raw as Record<string, unknown>
  const url = asString(source.url).trim()
  const urls = asStringList(source.urls)
  const kindRaw = asString(source.kind)
  const kind: LiturgyWebKind =
    kindRaw === 'youtube' ||
    kindRaw === 'vimeo' ||
    kindRaw === 'site' ||
    kindRaw === 'video' ||
    kindRaw === 'image' ||
    kindRaw === 'pdf'
      ? kindRaw
      : 'site'

  const primary = url || urls[0] || ''

  return {
    active: source.active === true && primary.length > 0,
    url: primary,
    urls: urls.length > 0 ? urls : primary ? [primary] : [], // NOSONAR
    title: asString(source.title).trim(),
    kind,
    videoId: asString(source.videoId).trim(),
    startedAt: asNumber(source.startedAt, 0),
    projectingScreens: source.projectingScreens === true,
  }
}

export function readLiturgyWebRuntimeFromStorage(): LiturgyWebProjectionRuntime {
  try {
    const raw = localStorage.getItem(LITURGY_WEB_RUNTIME_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_LITURGY_WEB_RUNTIME }
    return normalizeLiturgyWebRuntime(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_LITURGY_WEB_RUNTIME }
  }
}

export function publishLiturgyWebRuntime(
  runtime: LiturgyWebProjectionRuntime,
): void {
  try {
    localStorage.removeItem('louvorja-liturgy-yt-leader')
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(LITURGY_WEB_RUNTIME_STORAGE_KEY, JSON.stringify(runtime))
  } catch {
    // storage indisponível
  }

  try {
    localStorage.setItem(
      LITURGY_PROJECTING_STORAGE_KEY,
      runtime.projectingScreens ? '1' : '0',
    )
  } catch {
    // ignore
  }

  try {
    const channel = new BroadcastChannel(LITURGY_WEB_RUNTIME_CHANNEL)
    channel.postMessage(runtime)
    channel.close()
  } catch {
    // BroadcastChannel indisponível
  }
}

export function patchLiturgyWebRuntime(
  patch: Partial<LiturgyWebProjectionRuntime>,
): LiturgyWebProjectionRuntime {
  const next = {
    ...readLiturgyWebRuntimeFromStorage(),
    ...patch,
  }
  publishLiturgyWebRuntime(next)
  return next
}

export function setLiturgyProjectingScreens(projecting: boolean): void {
  patchLiturgyWebRuntime({ projectingScreens: projecting })
}

export function clearLiturgyWebRuntime(): void {
  publishLiturgyWebRuntime({ ...DEFAULT_LITURGY_WEB_RUNTIME })
}

export function publishLiturgyYtSync(payload: LiturgyYtSyncPayload): void {
  try {
    const channel = new BroadcastChannel(LITURGY_YT_SYNC_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // BroadcastChannel indisponível
  }
}

export function publishLiturgySiteSync(payload: LiturgySiteSyncPayload): void {
  try {
    const channel = new BroadcastChannel(LITURGY_SITE_SYNC_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // BroadcastChannel indisponível
  }
}

export function normalizeLiturgyYtSync(raw: unknown): LiturgyYtSyncPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  return {
    videoId: asString(source.videoId),
    currentTime: asNumber(source.currentTime, 0),
    isPaused: source.isPaused === true,
    volume: Math.min(1, Math.max(0, asNumber(source.volume, 1))),
    muted: source.muted === true,
    updatedAt: asNumber(source.updatedAt, Date.now()),
  }
}

export function normalizeLiturgySiteSync(
  raw: unknown,
): LiturgySiteSyncPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const url = asString(source.url).trim()
  if (!url) return null
  return {
    url,
    scrollX: asNumber(source.scrollX, 0),
    scrollY: asNumber(source.scrollY, 0),
    reloadToken: asNumber(source.reloadToken, 0),
    updatedAt: asNumber(source.updatedAt, Date.now()),
  }
}
