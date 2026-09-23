// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import {
  isScreenEnumerationSupported,
  listScreens,
  requestScreenAccess,
  identifyScreens,
  subscribeScreensChanged,
} from '../display-service-web'

function stubGetScreenDetails(screens: unknown[] | null) {
  if (screens === null) {
    // API não existe (Firefox/Safari)
    delete (window as unknown as { getScreenDetails?: unknown }).getScreenDetails
    return
  }
  ;(window as unknown as { getScreenDetails: unknown }).getScreenDetails = vi
    .fn()
    .mockResolvedValue({ screens })
}

describe('display-service-web (WT-5H)', () => {
  beforeEach(() => {
    for (const prop of ['availWidth', 'availHeight', 'width', 'height']) {
      Object.defineProperty(window.screen, prop, { value: 1920, configurable: true })
    }
    Object.defineProperty(window.screen, 'availHeight', { value: 1040, configurable: true })
    Object.defineProperty(window.screen, 'availLeft', { value: 0, configurable: true })
    Object.defineProperty(window.screen, 'availTop', { value: 0, configurable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sem API: fallback limitado só com a tela atual', async () => {
    stubGetScreenDetails(null)
    expect(isScreenEnumerationSupported()).toBe(false)
    const result = await listScreens()
    expect(result.supported).toBe(false)
    expect(result.limited).toBe(true)
    expect(result.screens).toHaveLength(1)
    expect(result.screens[0]?.isPrimary).toBe(true)
  })

  it('com permissão: mapeia múltiplos monitores com id por posição', async () => {
    stubGetScreenDetails([
      { availLeft: 0, availTop: 0, availWidth: 1920, availHeight: 1040, isPrimary: true, isInternal: true },
      { availLeft: 1920, availTop: 0, availWidth: 1366, availHeight: 728, isPrimary: false, isInternal: false },
    ])
    const result = await listScreens()
    expect(result.limited).toBe(false)
    expect(result.screens).toHaveLength(2)
    expect(result.screens[0]?.id).toBe('0:0')
    expect(result.screens[1]?.id).toBe('1920:0')
    expect(result.screens[1]?.isPrimary).toBe(false)
  })

  it('permissão negada: fallback honesto com limited=true', async () => {
    ;(window as unknown as { getScreenDetails: unknown }).getScreenDetails = vi
      .fn()
      .mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    const result = await requestScreenAccess()
    expect(result.limited).toBe(true)
    expect(result.supported).toBe(true)
    expect(result.screens[0]?.label).toBe('Esta tela')
  })

  it('identifyScreens abre uma janela numerada por monitor e fecha em 3s', () => {
    vi.useFakeTimers()
    const opened: { name: string; features: string; closed: boolean }[] = []
    vi.stubGlobal(
      'open',
      vi.fn((url: string, name: string, features: string) => {
        const win = { name, features, closed: false, close: () => { win.closed = true } }
        opened.push(win)
        return win
      }),
    )
    const wins = identifyScreens([
      { id: '0:0', label: 'A', left: 0, top: 0, width: 1920, height: 1040, isPrimary: true, isInternal: false },
      { id: '1920:0', label: 'B', left: 1920, top: 0, width: 1366, height: 728, isPrimary: false, isInternal: false },
    ])
    expect(wins).toHaveLength(2)
    expect(opened[0]?.name).toBe('identify-0:0')
    expect(opened[0]?.features).toContain('left=0')
    expect(opened[1]?.features).toContain('left=1920')
    vi.advanceTimersByTime(3100)
    expect(opened.every((w) => w.closed)).toBe(true)
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('subscribeScreensChanged inscreve e desinscreve', () => {
    stubGetScreenDetails([])
    const calls = vi.fn()
    const unsub = subscribeScreensChanged(calls)
    window.dispatchEvent(new Event('screenschange'))
    expect(calls).toHaveBeenCalledTimes(1)
    unsub()
    window.dispatchEvent(new Event('screenschange'))
    expect(calls).toHaveBeenCalledTimes(1)
  })
})
