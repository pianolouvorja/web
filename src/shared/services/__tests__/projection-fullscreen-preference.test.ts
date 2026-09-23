import { beforeEach, describe, expect, it } from 'vitest'

import {
  getProjectionFullscreenMode,
  setProjectionFullscreenMode,
} from '../projection-preferences'

// user-preferences mantém cache de module; reset explícito do campo basta.
describe('projection fullscreen preference', () => {
  beforeEach(() => {
    const data = JSON.parse(localStorage.getItem('user_data') ?? '{}')
    delete data['projection.fullscreenMode']
    localStorage.setItem('user_data', JSON.stringify(data))
  })

  it('liga por padrão e persiste mudança', () => {
    expect(getProjectionFullscreenMode()).toBe(true)
    setProjectionFullscreenMode(false)
    expect(getProjectionFullscreenMode()).toBe(false)
  })
})
