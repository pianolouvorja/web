// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { useWebUpdateChecker } from '../useWebUpdateChecker'

// Em node, __APP_VERSION__ não existe → usa fallback '0.0.0'
describe('useWebUpdateChecker (SSR / no-window)', () => {
  it('dismiss não falha sem sessionStorage', () => {
    const { dismiss, dismissed } = useWebUpdateChecker()
    dismiss()
    expect(dismissed.value).toBe(true)
  })

  it('init não falha sem window', () => {
    const { init } = useWebUpdateChecker()
    init()
    // Sem crash
  })

  it('checkForUpdates não falha sem fetch', async () => {
    const { checkForUpdates, hasUpdate } = useWebUpdateChecker()
    await checkForUpdates()
    expect(hasUpdate.value).toBe(false)
  })
})
