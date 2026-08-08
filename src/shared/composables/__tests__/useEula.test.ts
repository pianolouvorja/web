import { beforeEach, describe, expect, it } from 'vitest'
import { useEula } from '../useEula'

describe('useEula', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns false when EULA not accepted yet', () => {
    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(false)
  })

  it('returns true after accepting EULA', () => {
    const { isAccepted, accept } = useEula()
    accept()
    expect(isAccepted.value).toBe(true)
  })

  it('persists acceptance in localStorage', () => {
    const { accept } = useEula()
    accept()
    expect(localStorage.getItem('eula_accepted_v1')).toBe('true')
  })

  it('reads acceptance from localStorage on init', () => {
    localStorage.setItem('eula_accepted_v1', 'true')
    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(true)
  })

  it('can decline (reset) acceptance', () => {
    const { accept, decline, isAccepted } = useEula()
    accept()
    decline()
    expect(isAccepted.value).toBe(false)
    expect(localStorage.getItem('eula_accepted_v1')).toBeNull()
  })

  it('uses current EULA version in the storage key', () => {
    const { accept, currentVersion } = useEula()
    accept()
    expect(localStorage.getItem(`eula_accepted_v${currentVersion}`)).toBe('true')
  })

  it('invalidates acceptance when version changes', () => {
    localStorage.setItem('eula_accepted_v0', 'true')
    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(false)
  })
})
