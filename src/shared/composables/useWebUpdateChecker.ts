import { ref } from 'vue'

export interface VersionInfo {
  version: string
  changelog?: string
  date?: string
}

/**
 * Compara duas strings de versão semântica (sem prefixes não-numéricos).
 * Retorna >0 se a>b, 0 se igual, <0 se a<b.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const parts = v.replace(/^v/, '').split('.').map(Number)
    while (parts.length < 4) parts.push(0)
    return parts
  }
  const [aParts, bParts] = [parse(a), parse(b)]
  for (let i = 0; i < 4; i++) {
    const diff = aParts[i] - bParts[i]
    if (diff !== 0) return diff
  }
  return 0
}

/** Versão atual do app (injetada via define no vite.config). */
declare const __APP_VERSION__: string

/** Retorna a versão atual do app (injetada via vite define). */
function getCurrentVersion(): string {
  return __APP_VERSION__
}

/**
 * Composable para checagem de versão no Web (PWA).
 * Faz fetch de /version.json e compara com a versão local.
 */
export function useWebUpdateChecker() {
  const hasUpdate = ref(false)
  const newVersion = ref<string | null>(null)
  const releaseNotes = ref<string | null>(null)
  const error = ref<string | null>(null)
  const dismissed = ref(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('update-dismissed') === 'true',
  )

  function dismiss() {
    dismissed.value = true
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('update-dismissed', 'true')
    }
  }

  async function checkForUpdates() {
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`)
      if (!response.ok) return

      const data: VersionInfo = await response.json()
      const currentVersion = getCurrentVersion()

      if (compareVersions(data.version, currentVersion) > 0) {
        hasUpdate.value = true
        newVersion.value = data.version
        releaseNotes.value = data.changelog ?? null
      }
    } catch {
      // Silencioso — offline ou erro
    }
  }

  function init() {
    setTimeout(checkForUpdates, 3000)
  }

  return {
    hasUpdate,
    newVersion,
    releaseNotes,
    error,
    dismissed,
    dismiss,
    checkForUpdates,
    init,
  }
}
