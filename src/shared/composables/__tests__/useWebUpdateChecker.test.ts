// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWebUpdateChecker, compareVersions } from '../useWebUpdateChecker'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock __APP_VERSION__
vi.stubGlobal('__APP_VERSION__', '1.17.0')

describe('useWebUpdateChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('estado inicial', () => {
    it('começa sem update e não dismissed', () => {
      const { hasUpdate, dismissed, newVersion, error } = useWebUpdateChecker()
      expect(hasUpdate.value).toBe(false)
      expect(dismissed.value).toBe(false)
      expect(newVersion.value).toBeNull()
      expect(error.value).toBeNull()
    })

    it('começa dismissed se sessionStorage tem flag', () => {
      sessionStorage.setItem('update-dismissed', 'true')
      const { dismissed } = useWebUpdateChecker()
      expect(dismissed.value).toBe(true)
    })
  })

  describe('dismiss', () => {
    it('marca dismissed e salva no sessionStorage', () => {
      const { dismissed, dismiss } = useWebUpdateChecker()
      dismiss()
      expect(dismissed.value).toBe(true)
      expect(sessionStorage.getItem('update-dismissed')).toBe('true')
    })
  })

  describe('checkForUpdates', () => {
    it('seta hasUpdate=true quando version.json tem versão maior', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          version: '1.18.0',
          changelog: '## Mudanças',
          date: '2026-08-08',
        }),
      })
      const { hasUpdate, newVersion, releaseNotes, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(true)
      expect(newVersion.value).toBe('1.18.0')
      expect(releaseNotes.value).toBe('## Mudanças')
    })

    it('mantém hasUpdate=false quando versão é igual', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.17.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(false)
    })

    it('mantém hasUpdate=false quando versão é menor', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.16.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(false)
    })

    it('não propaga erro quando fetch falha (offline)', async () => {
      mockFetch.mockRejectedValue(new Error('network'))
      const { hasUpdate, error, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('não propaga erro quando response não ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 })
      const { hasUpdate, error, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('init dispara checkForUpdates após 3s (timer)', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.17.0' }),
      })
      const { init } = useWebUpdateChecker()
      init()
      expect(mockFetch).not.toHaveBeenCalled()
      vi.advanceTimersByTime(3000)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('detecta versão maior com patch diferente (2.0.0 vs 1.17.0)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(true)
    })

    it('detecta versão maior com minor diferente (1.18.0 vs 1.17.0)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.18.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(true)
    })

    it('detecta versão maior com prefixo v (v2.0.0 vs 1.17.0)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: 'v2.0.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(true)
    })

    it('detecta versão menor com segments diferentes (1.16.0 vs 1.17.0)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.16.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(false)
    })

    it('detecta igualdade com versão idêntica (1.17.0 vs 1.17.0)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.17.0' }),
      })
      const { hasUpdate, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(hasUpdate.value).toBe(false)
    })

    it('lida com version.json sem campo changelog', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      })
      const { releaseNotes, checkForUpdates } = useWebUpdateChecker()
      await checkForUpdates()
      expect(releaseNotes.value).toBeNull()
    })
  })

  describe('compareVersions (unit)', () => {
    it('retorna 0 para versões idênticas', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    })

    it('retorna >0 quando a > b', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0)
    })

    it('retorna <0 quando a < b', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0)
    })

    it('lida com prefixo v', () => {
      expect(compareVersions('v2.0.0', '1.0.0')).toBeGreaterThan(0)
    })

    it('lida com segments de tamanho diferente (1.0 vs 1.0.0)', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0)
    })
  })
})
