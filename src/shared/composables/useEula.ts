import { computed, ref } from 'vue'

const EULA_VERSION = 1

const storageKey = `eula_accepted_v${EULA_VERSION}`

function readStored(): boolean {
  try {
    return localStorage.getItem(storageKey) === 'true'
  } catch (_e) {
    return false
  }
}

// Estado global (singleton) — todas as instâncias de useEula() compartilham
// o mesmo ref. Sem isso, cada componente recebe uma instância nova e o
// aceite num não propaga para o outro.
const accepted = ref(readStored())

/**
 * Reseta o estado do EULA para o valor atual do localStorage.
 * Usado em testes para isolar cada caso.
 * @internal
 */
export function _resetEulaState(): void {
  accepted.value = readStored()
}

export function useEula() {
  const isAccepted = computed(() => accepted.value)

  const currentVersion = EULA_VERSION

  function accept(): void {
    accepted.value = true
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // localStorage indisponível (modo privado, etc.)
    }
  }

  function decline(): void {
    accepted.value = false
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // noop
    }
  }

  return { isAccepted, accept, decline, currentVersion }
}
