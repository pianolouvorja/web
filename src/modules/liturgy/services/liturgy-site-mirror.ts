/**
 * Espelho ao vivo do site (controle → telas).
 *
 * No browser, iframe cross-origin não permite ler scroll/URL.
 * Estratégia: captura da aba no controle + compartilha o MediaStream
 * com as telas same-origin via referência na janela de controle
 * (sem WebRTC — mais estável entre popups locais).
 */

export const LITURGY_SITE_MIRROR_CHANNEL = 'louvorja-liturgy-site-mirror'
export const LITURGY_CONTROL_WINDOW_NAME = 'LiturgyWebControl'

const MIRROR_STREAM_KEY = '__louvorjaLiturgyMirrorStream'
const MIRROR_VERSION_KEY = '__louvorjaLiturgyMirrorVersion'

type MirrorSignal =
  | { type: 'mirror-ready'; version: number }
  | { type: 'mirror-stopped'; version: number }

type CropTargetStatic = {
  fromElement: (element: Element) => Promise<unknown>
}

type CroppableTrack = MediaStreamTrack & {
  cropTo?: (target: unknown) => Promise<void>
}

type MirrorHostWindow = Window & {
  [MIRROR_STREAM_KEY]?: MediaStream | null
  [MIRROR_VERSION_KEY]?: number
}

function asMirrorHost(win: Window | null | undefined): MirrorHostWindow | null {
  if (!win || win.closed) return null
  return win as MirrorHostWindow
}

function postSignal(payload: MirrorSignal) {
  try {
    const channel = new BroadcastChannel(LITURGY_SITE_MIRROR_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // ignore
  }
}

async function maybeCropToElement(
  stream: MediaStream,
  element: HTMLElement | null,
): Promise<void> {
  if (!element) return
  const CropTarget = (window as unknown as { CropTarget?: CropTargetStatic })
    .CropTarget
  const track = stream.getVideoTracks()[0] as CroppableTrack | undefined
  if (!CropTarget?.fromElement || !track?.cropTo) return
  try {
    const target = await CropTarget.fromElement(element)
    await track.cropTo(target)
  } catch {
    // Crop opcional
  }
}

/** Captura a aba/janela atual (gesto do usuário obrigatório). */
export async function captureCurrentSurface(
  cropElement?: HTMLElement | null,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 30 },
    },
    audio: false,
    // Extensões Chromium — ignoradas onde não existirem.
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'exclude',
    systemAudio: 'exclude',
  } as DisplayMediaStreamOptions)

  await maybeCropToElement(stream, cropElement ?? null)
  return stream
}

function publishMirrorOnWindow(stream: MediaStream | null, version: number) {
  const host = window as MirrorHostWindow
  host[MIRROR_STREAM_KEY] = stream
  host[MIRROR_VERSION_KEY] = version
}

/**
 * Resolve a janela de controle que publica o MediaStream.
 * Só chama window.open com nome quando já recebemos mirror-ready
 * (janela existe) — evita criar aba about:blank.
 */
function resolveControlHost(): MirrorHostWindow | null {
  const self = window as MirrorHostWindow
  if (self.name === LITURGY_CONTROL_WINDOW_NAME || self[MIRROR_STREAM_KEY]) {
    return self
  }

  const opener = asMirrorHost(window.opener)
  if (opener?.[MIRROR_STREAM_KEY]) return opener

  // Irmão aberto pelo mesmo opener (main → control + screens).
  if (opener) {
    try {
      const named = asMirrorHost(opener.open('', LITURGY_CONTROL_WINDOW_NAME))
      if (named && !named.closed) {
        // Se criou blank sem stream, fecha e ignora.
        try {
          if (
            named.location.href === 'about:blank' &&
            !named[MIRROR_STREAM_KEY]
          ) {
            named.close()
            return null
          }
        } catch {
          // cross-origin improvável entre nossos popups
        }
        if (named[MIRROR_STREAM_KEY]) return named
      }
    } catch {
      // ignore
    }
  }

  return null
}

export function readMirrorStreamFromHost(): MediaStream | null {
  const host = resolveControlHost()
  const stream = host?.[MIRROR_STREAM_KEY] ?? null
  if (!stream) return null
  const live = stream.getVideoTracks().some((track) => track.readyState === 'live')
  return live ? stream : null
}

export type SiteMirrorBroadcaster = {
  stop: () => void
  version: number
}

/** Publica o MediaStream do controle para as telas same-origin. */
export function startSiteMirrorBroadcaster(
  stream: MediaStream,
): SiteMirrorBroadcaster {
  const version = Date.now()
  publishMirrorOnWindow(stream, version)
  postSignal({ type: 'mirror-ready', version })

  const announceTimer = window.setInterval(() => {
    if (!stream.getVideoTracks().some((track) => track.readyState === 'live')) {
      stop()
      return
    }
    postSignal({ type: 'mirror-ready', version })
  }, 1500)

  const onTrackEnded = () => {
    stop()
  }
  stream.getVideoTracks().forEach((track) => {
    track.addEventListener('ended', onTrackEnded)
  })

  function stop() {
    window.clearInterval(announceTimer)
    stream.getTracks().forEach((track) => {
      track.removeEventListener('ended', onTrackEnded)
      try {
        track.stop()
      } catch {
        // ignore
      }
    })
    publishMirrorOnWindow(null, version)
    postSignal({ type: 'mirror-stopped', version })
  }

  return { stop, version }
}

export type SiteMirrorViewer = {
  stop: () => void
}

/** Nas telas: escuta o sinal e anexa o MediaStream do controle. */
export function startSiteMirrorViewer(
  onStream: (stream: MediaStream | null) => void,
): SiteMirrorViewer {
  let channel: BroadcastChannel | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let current: MediaStream | null = null

  const apply = (stream: MediaStream | null) => {
    if (current === stream) return
    current = stream
    onStream(stream)
  }

  const tryAttach = () => {
    const stream = readMirrorStreamFromHost()
    apply(stream)
  }

  try {
    channel = new BroadcastChannel(LITURGY_SITE_MIRROR_CHANNEL)
    channel.addEventListener('message', (event: MessageEvent<MirrorSignal>) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'mirror-ready') {
        tryAttach()
        return
      }
      if (data.type === 'mirror-stopped') {
        apply(null)
      }
    })
  } catch {
    channel = null
  }

  // Poll curto: cobre race em que o sinal chegou antes do listener.
  pollTimer = setInterval(() => {
    tryAttach()
  }, 500)
  tryAttach()

  function stop() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    channel?.close()
    channel = null
    apply(null)
  }

  return { stop }
}
