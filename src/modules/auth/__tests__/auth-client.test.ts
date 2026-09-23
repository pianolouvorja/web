import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getAuthSession, authHeaders } from '../services/auth-client'

const SESSION_KEY = 'louvorja.custom.auth'

function makeStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  }
}

let mockStorage: ReturnType<typeof makeStorage>

function makeSession(token = 'test-token-123', userId = 42, email = 'test@test.com', displayName = 'Test User') {
  return { token, user: { id_user: userId, email, displayName } }
}

describe('auth-client — sessão custom (email+senha)', () => {
  beforeEach(() => {
    mockStorage = makeStorage()
    vi.stubGlobal('localStorage', mockStorage)
  })

  it('getAuthSession: localStorage vazio → null', () => {
    expect(getAuthSession()).toBeNull()
  })

  it('getAuthSession: JSON inválido → null', () => {
    mockStorage.setItem(SESSION_KEY, 'not-json')
    expect(getAuthSession()).toBeNull()
  })

  it('getAuthSession: sessão sem token → null', () => {
    mockStorage.setItem(SESSION_KEY, JSON.stringify({ user: { id_user: 1, email: 'a@b.c', displayName: 'X' } }))
    expect(getAuthSession()).toBeNull()
  })

  it('getAuthSession: sessão sem user.id_user → null', () => {
    mockStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'tok', user: { email: 'a@b.c', displayName: 'X' } }))
    expect(getAuthSession()).toBeNull()
  })

  it('getAuthSession: sessão válida → AuthSession', () => {
    const sess = makeSession()
    mockStorage.setItem(SESSION_KEY, JSON.stringify(sess))
    expect(getAuthSession()).toEqual(sess)
  })

  it('authHeaders: sem sessão → objeto vazio', () => {
    expect(authHeaders()).toEqual({})
  })

  it('authHeaders: com sessão → Authorization: Bearer <token>', () => {
    const sess = makeSession('my-jwt-token')
    mockStorage.setItem(SESSION_KEY, JSON.stringify(sess))
    expect(authHeaders()).toEqual({ authorization: 'Bearer my-jwt-token' })
  })
})