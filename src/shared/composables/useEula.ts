import { computed, ref } from 'vue'

const EULA_VERSION = 1

const storageKey = `eula_accepted_v${EULA_VERSION}`

function readStored(): boolean {
  try {
    return localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

export function useEula() {
  const accepted = ref(readStored())

  const isAccepted = computed(() => accepted.value)

  const currentVersion = EULA_VERSION

  function accept(): void {
    accepted.value = true
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // localStorage indisponivel (modo privado, etc.)
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
