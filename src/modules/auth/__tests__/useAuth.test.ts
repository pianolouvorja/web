import { describe, expect, it, vi, beforeEach } from 'vitest'

describe('useAuth — composable reativo (smoke)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('importa sem erro e expõe interface esperada', async () => {
    const { useAuth } = await import('../composables/useAuth')
    const api = useAuth()

    expect(api.session).toBeDefined()
    expect(api.isLoggedIn).toBeDefined()
    expect(api.userName).toBeDefined()
    expect(api.userEmail).toBeDefined()
    expect(typeof api.login).toBe('function')
    expect(typeof api.register).toBe('function')
    expect(typeof api.logout).toBe('function')
    expect(typeof api.forgotPassword).toBe('function')
    expect(typeof api.resetPassword).toBe('function')
  })
})