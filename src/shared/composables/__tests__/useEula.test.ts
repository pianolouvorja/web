import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEula, _resetEulaState } from '../useEula'

describe('useEula', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetEulaState()
    vi.restoreAllMocks()
  })

  // --- Estado inicial ---

  it('retorna false quando EULA ainda nao foi aceito', () => {
    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(false)
  })

  it('retorna true apos aceitar o EULA', () => {
    const { isAccepted, accept } = useEula()
    accept()
    expect(isAccepted.value).toBe(true)
  })

  // --- Persistencia ---

  it('persiste aceite no localStorage', () => {
    const { accept } = useEula()
    accept()
    expect(localStorage.getItem('eula_accepted_v1')).toBe('true')
  })

  it('le aceite do localStorage na inicializacao', () => {
    localStorage.setItem('eula_accepted_v1', 'true')
    _resetEulaState()

    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(true)
  })

  it('pode recusar (resetar) o aceite', () => {
    const { accept, decline, isAccepted } = useEula()
    accept()
    decline()
    expect(isAccepted.value).toBe(false)
    expect(localStorage.getItem('eula_accepted_v1')).toBeNull()
  })

  // --- Versao ---

  it('usa versao atual do EULA na chave do storage', () => {
    const { accept, currentVersion } = useEula()
    accept()
    expect(localStorage.getItem(`eula_accepted_v${currentVersion}`)).toBe('true')
  })

  it('invalida aceite quando versao muda', () => {
    localStorage.setItem('eula_accepted_v0', 'true')
    _resetEulaState()

    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(false)
  })

  // --- Singleton (FIX do bug critico) ---

  it('compartilha estado entre multiplas chamadas de useEula() (singleton)', () => {
    const instanceA = useEula()
    const instanceB = useEula()

    instanceA.accept()
    expect(instanceB.isAccepted.value).toBe(true)
  })

  it('decline numa instancia reflete na outra (singleton)', () => {
    const instanceA = useEula()
    const instanceB = useEula()

    instanceA.accept()
    instanceB.decline()
    expect(instanceA.isAccepted.value).toBe(false)
  })

  // --- Tratamento de erros ---

  it('nao quebra quando localStorage.setItem lanca erro (modo privado)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })

    const { accept, isAccepted } = useEula()
    expect(() => accept()).not.toThrow()
    expect(isAccepted.value).toBe(true)

    spy.mockRestore()
  })

  it('retorna false quando localStorage.getItem lanca erro na inicializacao', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    _resetEulaState()

    const { isAccepted } = useEula()
    expect(isAccepted.value).toBe(false)

    spy.mockRestore()
  })

  it('nao quebra quando localStorage.removeItem lanca erro (decline)', () => {
    const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    const { decline, isAccepted } = useEula()
    expect(() => decline()).not.toThrow()
    expect(isAccepted.value).toBe(false)

    spy.mockRestore()
  })
})
