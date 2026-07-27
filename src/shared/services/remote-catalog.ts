import { BROWSER_STORAGE_KEYS } from '@shared/constants/storage-keys'
import { getBrowserItem, setBrowserItem } from '@shared/services/browser-storage'

function sessionCacheKey(filename: string): string {
  return `${BROWSER_STORAGE_KEYS.catalogSessionPrefix}${filename}`
}

export function resolveDatabaseUrl(relativePath: string): string {
  const base = import.meta.env.VITE_URL_DATABASE ?? 'https://api.louvorja.com.br/json_db'
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  return `${base}${path}`
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchRemoteCatalogJson<T = unknown>(
  file: string,
  retries = 5,
  delayMs = 1000,
): Promise<T> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '') // NOSONAR
  const token = import.meta.env.VITE_API_TOKEN

  try {
    const response = await fetch(`${resolveDatabaseUrl(`/${file}`)}?${date}`, { // NOSONAR
      headers: token ? { 'Api-Token': token } : undefined,
    })

    if (response.status === 429 && retries > 0) {
      await delay(delayMs)
      return fetchRemoteCatalogJson(file, retries - 1, delayMs * 1.5)
    }

    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        await delay(delayMs)
        return fetchRemoteCatalogJson(file, retries - 1, delayMs * 1.5)
      }
      throw new Error(`Servidor retornou erro ${response.status}`)
    }

    const data = (await response.json()) as T
    setBrowserItem(sessionCacheKey(file), data, 'session')
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      retries > 0 &&
      (message.includes('Failed to fetch') || message.includes('NetworkError'))
    ) {
      await delay(delayMs)
      return fetchRemoteCatalogJson(file, retries - 1, delayMs * 1.5)
    }
    throw error
  }
}

/** Lê do sessionStorage; se ausente, busca na API remota. */
export async function readOrFetchCatalogJson<T = unknown>(
  filename: string,
): Promise<T | null> {
  const cached = getBrowserItem<T>(sessionCacheKey(filename), null, 'session')
  if (cached != null) return cached

  try {
    return await fetchRemoteCatalogJson<T>(filename)
  } catch (error) {
    console.warn(`[catalog] falha ao obter ${filename}`, error)
    return null
  }
}
