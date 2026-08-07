import {
  closeLiturgyControlWindow,
  closeScreenPopups,
  exitPopupModule,
  openLiturgyControlWindow,
  openPopupModule,
} from '@shared/services/popup-windows'
import { getTargetPopupSlots } from '@shared/services/projection-preferences'

import {
  clearLiturgyWebRuntime,
  isBrowsableMediaUrl,
  parseLiturgyWebTarget,
  publishLiturgyWebRuntime,
  readLiturgyWebRuntimeFromStorage,
  setLiturgyProjectingScreens,
  type LiturgyWebKind,
} from './liturgy-web-runtime'

const LITURGY_WEB_MODULE_ID = 'liturgy-web'

type LiturgyWebProjectionOptions = {
  mode?: 'video' | 'site' | 'image' | 'pdf' | 'presentation'
  withScreens?: boolean
}

async function openLiturgyPopup(
  kind: LiturgyWebKind,
  url: string,
  title: string,
  options?: { videoId?: string; urls?: string[]; withScreens?: boolean },
): Promise<boolean> {
  const withScreens = options?.withScreens ?? true

  publishLiturgyWebRuntime({
    active: true,
    url,
    urls: options?.urls?.length ? options.urls : url ? [url] : [], // NOSONAR
    title,
    kind,
    videoId: options?.videoId ?? '',
    startedAt: Date.now(),
    projectingScreens: withScreens,
  })

  // Sempre abre o controle dedicado (≈ Electron sourceWindow).
  const controlOk = openLiturgyControlWindow(LITURGY_WEB_MODULE_ID)
  if (!controlOk) return false

  if (!withScreens) {
    closeScreenPopups()
    setLiturgyProjectingScreens(false)
    return true
  }

  const screensOk = await openPopupModule(LITURGY_WEB_MODULE_ID)
  setLiturgyProjectingScreens(screensOk)
  return controlOk
}

/**
 * Abre URL nas telas configuradas (popups web).
 */
export async function openLiturgyWebOnConfiguredScreens(
  rawUrl: string,
  title = '',
  options: LiturgyWebProjectionOptions = {},
): Promise<boolean> {
  const target = parseLiturgyWebTarget(rawUrl)
  if (!target) return false

  const label = title.trim() || rawUrl.trim() || target.url
  const mode = options.mode ?? (target.kind === 'site' ? 'site' : 'video')
  const kind: LiturgyWebKind =
    mode === 'site'
      ? 'site'
      : target.kind === 'youtube' || target.kind === 'vimeo' // NOSONAR
        ? target.kind
        : 'site'

  return openLiturgyPopup(kind, target.url, label, {
    videoId: target.videoId,
    withScreens: options.withScreens ?? true,
  })
}

/** Popup de controle do site (mesma stack de popups na web). */
export async function openLiturgySiteControl(
  rawUrl: string,
  title = '',
): Promise<boolean> {
  return openLiturgyWebOnConfiguredScreens(rawUrl, title, {
    mode: 'site',
    withScreens: false,
  })
}

/** Popup de controle do vídeo online. */
export async function openLiturgyVideoControl(
  rawUrl: string,
  title = '',
): Promise<boolean> {
  return openLiturgyWebOnConfiguredScreens(rawUrl, title, {
    mode: 'video',
    withScreens: false,
  })
}

/** Site + projeção nas telas (popups). */
export async function openLiturgySiteOnScreens(
  rawUrl: string,
  title = '',
): Promise<boolean> {
  return openLiturgyWebOnConfiguredScreens(rawUrl, title, {
    mode: 'site',
    withScreens: true,
  })
}

/** Abre vídeo online nas telas configuradas. */
export async function playLiturgyWebOnConfiguredScreens(
  rawUrl: string,
  title = '',
): Promise<boolean> {
  const target = parseLiturgyWebTarget(rawUrl)
  if (!target) return false

  if (target.kind === 'site') {
    return openLiturgySiteOnScreens(rawUrl, title)
  }

  return openLiturgyWebOnConfiguredScreens(rawUrl, title, {
    mode: 'video',
    withScreens: true,
  })
}

async function openLiturgyLocalVideo(
  filePath: string,
  title = '', // NOSONAR
  withScreens: boolean,
): Promise<boolean> {
  const path = filePath.trim()
  if (!isBrowsableMediaUrl(path)) return false

  const label = title.trim() || path.split(/[\\/]/).pop() || path
  return openLiturgyPopup('video', path, label, { withScreens })
}

export async function openLiturgyLocalVideoControl(
  filePath: string,
  title = '',
): Promise<boolean> {
  return openLiturgyLocalVideo(filePath, title, false)
}

export async function playLiturgyLocalVideoOnScreens(
  filePath: string,
  title = '',
): Promise<boolean> {
  return openLiturgyLocalVideo(filePath, title, true)
}

async function openLiturgyLocalImages(
  filePaths: string[],
  title = '', // NOSONAR
  withScreens: boolean,
): Promise<boolean> {
  const paths = filePaths
    .map((entry) => entry.trim())
    .filter((entry) => isBrowsableMediaUrl(entry))
  if (paths.length === 0) return false

  const label = title.trim() || paths[0]?.split(/[\\/]/).pop() || 'Imagens'
  return openLiturgyPopup('image', paths[0]!, label, {
    urls: paths,
    withScreens,
  })
}

export async function openLiturgyLocalImageControl(
  filePaths: string[],
  title = '',
): Promise<boolean> {
  return openLiturgyLocalImages(filePaths, title, false)
}

export async function playLiturgyLocalImageOnScreens(
  filePaths: string[],
  title = '',
): Promise<boolean> {
  return openLiturgyLocalImages(filePaths, title, true)
}

async function openLiturgyLocalPdf(
  filePath: string,
  title = '', // NOSONAR
  withScreens: boolean,
): Promise<boolean> {
  const path = filePath.trim()
  if (!isBrowsableMediaUrl(path)) return false

  const label = title.trim() || path.split(/[\\/]/).pop() || 'PDF'
  return openLiturgyPopup('pdf', path, label, { withScreens })
}

export async function openLiturgyLocalPdfControl(
  filePath: string,
  title = '',
): Promise<boolean> {
  return openLiturgyLocalPdf(filePath, title, false)
}

export async function playLiturgyLocalPdfOnScreens(
  filePath: string,
  title = '',
): Promise<boolean> {
  return openLiturgyLocalPdf(filePath, title, true)
}

/** PPT/PPTX exige LibreOffice no desktop — indisponível no browser. */
async function openLiturgyLocalPresentation(
  _filePath: string,
  _title = '', // NOSONAR
  _withScreens: boolean,
): Promise<boolean> {
  return false
}

export async function openLiturgyLocalPresentationControl(
  filePath: string,
  title = '',
): Promise<boolean> {
  return openLiturgyLocalPresentation(filePath, title, false)
}

export async function playLiturgyLocalPresentationOnScreens(
  filePath: string,
  title = '',
): Promise<boolean> {
  return openLiturgyLocalPresentation(filePath, title, true)
}

/** Liga/desliga telas a partir da barra do controle (gesto do usuário na popup). */
export async function toggleLiturgyScreensFromControl(): Promise<boolean> {
  const runtime = readLiturgyWebRuntimeFromStorage()
  if (!runtime.active) return false

  if (runtime.projectingScreens) {
    closeScreenPopups()
    setLiturgyProjectingScreens(false)
    return false
  }

  const slots = getTargetPopupSlots()
  const opened = await openPopupModule(LITURGY_WEB_MODULE_ID, {
    slots: slots.length ? slots : undefined,
  })
  setLiturgyProjectingScreens(opened)
  return opened
}

/** Fecha popups de liturgia e limpa o runtime. */
export async function closeLiturgyWebProjection(): Promise<void> {
  clearLiturgyWebRuntime()
  closeScreenPopups()
  closeLiturgyControlWindow()
  await exitPopupModule()
}
