/**
 * WT-5H: detecção de monitores no web — paridade do display-service do app
 * (~/piano-app), usando a Window Management API (Chrome/Edge).
 *
 * O app lista monitores via Electron IPC (screen.getAllDisplays). No web a
 * equivalente é window.getScreenDetails(), que exige permissão
 * 'window-management' concedida num gesto do operador. Sem permissão,
 * retornamos SÓ a tela atual com limited:true — a UI explica e oferece o
 * botão "Detectar telas".
 */

export interface WebScreen {
  /** Estável por posição física (sobrevive a reload). */
  id: string
  label: string
  left: number
  top: number
  width: number
  height: number
  isPrimary: boolean
  isInternal: boolean
}

export type ScreenListResult = {
  screens: WebScreen[]
  /** true = sem permissão window-management (só a tela atual é visível). */
  limited: boolean
  /** true = browser suporta a API (Chrome/Edge). */
  supported: boolean
}

type DetailedScreen = {
  label?: string
  availLeft: number
  availTop: number
  availWidth: number
  availHeight: number
  width: number
  height: number
  isPrimary: boolean
  isInternal: boolean
}

type ScreenDetails = { screens: DetailedScreen[] }

function mapScreen(s: DetailedScreen, index: number): WebScreen {
  return {
    id: `${s.availLeft}:${s.availTop}`,
    label: s.label?.trim() || `Monitor ${index + 1}`,
    left: s.availLeft,
    top: s.availTop,
    width: s.availWidth,
    height: s.availHeight,
    isPrimary: s.isPrimary,
    isInternal: s.isInternal,
  }
}

function mapFallback(): WebScreen {
  return {
    id: `${window.screen.availLeft}:${window.screen.availTop}`,
    label: 'Esta tela',
    left: window.screen.availLeft ?? 0,
    top: window.screen.availTop ?? 0,
    width: window.screen.availWidth || window.screen.width,
    height: window.screen.availHeight || window.screen.height,
    isPrimary: true,
    isInternal: false,
  }
}

export function isScreenEnumerationSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.getScreenDetails === 'function'
}

/** Lista telas sem pedir permissão (usar o que já foi concedido). */
export async function listScreens(): Promise<ScreenListResult> {
  if (!isScreenEnumerationSupported()) {
    return { screens: [mapFallback()], limited: true, supported: false }
  }
  try {
    const details = (await window.getScreenDetails()) as ScreenDetails
    const mapped = details.screens.map(mapScreen)
    if (mapped.length === 0) {
      return { screens: [mapFallback()], limited: true, supported: true }
    }
    return { screens: mapped, limited: false, supported: true }
  } catch {
    // NotAllowedError: permissão negada/nunca pedida — fallback honesto.
    return { screens: [mapFallback()], limited: true, supported: true }
  }
}

/**
 * Pede permissão e lista. DEVE ser chamado dentro de um gesto do operador
 * (clique no botão "Detectar telas") — o Chrome abre o prompt nativo.
 */
export async function requestScreenAccess(): Promise<ScreenListResult> {
  if (!isScreenEnumerationSupported()) {
    return { screens: [mapFallback()], limited: true, supported: false }
  }
  try {
    const details = (await window.getScreenDetails()) as ScreenDetails
    const mapped = details.screens.map(mapScreen)
    return {
      screens: mapped.length > 0 ? mapped : [mapFallback()],
      limited: mapped.length === 0,
      supported: true,
    }
  } catch {
    return { screens: [mapFallback()], limited: true, supported: true }
  }
}

/**
 * Identificar telas: abre uma mini-janela numerada EM CADA monitor por 3s
 * (paridade do identify-overlay do app). Retorna as janelas abertas p/ teste.
 */
export function identifyScreens(screens: WebScreen[]): Window[] {
  const opened: Window[] = []
  screens.forEach((screen, index) => {
    const html =
      `<!doctype html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#131313;color:#fff;font:700 22vw system-ui;border:6px solid #E0895A;box-sizing:border-box">${index + 1}</body></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const win = window.open(
      url,
      `identify-${screen.id}`,
      `popup=yes,left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height}`,
    )
    if (win) opened.push(win)
    window.setTimeout(() => {
      try {
        win?.close()
        URL.revokeObjectURL(url)
      } catch {
        // já fechada
      }
    }, 3000)
  })
  return opened
}

/** Inscreve no hotplug (screenschange) — paridade displays:changed do app. */
export function subscribeScreensChanged(
  callback: () => void,
): () => void {
  if (!isScreenEnumerationSupported()) return () => {}
  window.addEventListener('screenschange', callback)
  return () => window.removeEventListener('screenschange', callback)
}
