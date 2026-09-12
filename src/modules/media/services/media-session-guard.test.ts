import { describe, expect, it } from 'vitest'

import { createMediaSessionGuard } from '../services/media-session-guard'

describe('media-session-guard — redireciona /media sem sessão ativa', () => {
  it('sem sessão: redireciona para albums', () => {
    const guard = createMediaSessionGuard(() => false)
    const result = guard({ name: 'media' } as never)
    expect(result).toEqual({ name: 'albums', replace: true })
  })

  it('com sessão ativa: permite navegação', () => {
    const guard = createMediaSessionGuard(() => true)
    const result = guard({ name: 'media' } as never)
    expect(result).toBe(true)
  })

  it('não interfere em outras rotas (mesmo sem sessão)', () => {
    const guard = createMediaSessionGuard(() => false)
    const result = guard({ name: 'albums' } as never)
    expect(result).toBe(true)
  })

  it('não interfere no media-editor', () => {
    const guard = createMediaSessionGuard(() => false)
    const result = guard({ name: 'media-editor' } as never)
    expect(result).toBe(true)
  })
})
