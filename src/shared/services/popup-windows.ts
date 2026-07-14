import { BROWSER_STORAGE_KEYS } from '@shared/constants/storage-keys'
import {
  captureCurrentBounds,
  getOpenFeatures,
  getPopupSlotId,
  parseSlotIndex,
  requestWindowManagementPermission,
  resolveBoundsForSlot,
  saveSlotBounds,
  scheduleRestoreOnWindow,
} from '@shared/services/popup-layout'
import { getPopupCount } from '@shared/services/projection-preferences'
import {
  getBrowserItem,
  setBrowserItem,
} from '@shared/services/browser-storage'

import {
  getPopupRefs,
  setPopupRefs,
  type PopupWindowRef,
} from './popup-registry'

export const POPUP_STATE_CHANNEL = 'louvorja-popup-state'

export type PopupSyncPayload = {
  param: string
  value: unknown
}

export type PopupActionPayload = {
  action: 'report-bounds' | 'restore-bounds'
}

function buildPopupUrl(slot: number, moduleId?: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const params = new URLSearchParams({ slot: String(slot) })
  const module = moduleId || getActiveModule()
  if (module) params.set('module', module)
  return `${normalizedBase}popup?${params.toString()}`
}

function openPopupWindow(slot: number, moduleId?: string): PopupWindowRef | null {
  const win = window.open(
    buildPopupUrl(slot, moduleId),
    getPopupSlotId(slot),
    getOpenFeatures(slot),
  ) as PopupWindowRef | null

  if (win) {
    win.__popupSlot = slot
  }

  return win
}

function persistPopups(popups: PopupWindowRef[]): PopupWindowRef[] {
  return setPopupRefs(popups)
}

function getActiveModule(): string {
  return getBrowserItem<string>(BROWSER_STORAGE_KEYS.popupModule, '') ?? ''
}

function setActiveModule(moduleId: string): void {
  setBrowserItem(BROWSER_STORAGE_KEYS.popupModule, moduleId || '')
  broadcastState({ param: 'popup_module', value: moduleId || '' })
}

function broadcastState(payload: PopupSyncPayload): void {
  try {
    const channel = new BroadcastChannel(POPUP_STATE_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // BroadcastChannel pode não existir em ambientes antigos
  }
}

function syncStateTo(popup: PopupWindowRef | null | undefined): void {
  if (!popup || popup.closed) return

  const payloads: PopupSyncPayload[] = [
    { param: 'popup_module', value: getActiveModule() },
  ]

  payloads.forEach((payload) => {
    try {
      popup.postMessage(payload, window.location.origin)
    } catch (error) {
      console.log(error)
    }
  })
}

function syncStateToAll(popups: PopupWindowRef[] = getPopupRefs()): void {
  popups.forEach(syncStateTo)
  broadcastState({ param: 'popup_module', value: getActiveModule() })
}

function scheduleSync(popups: PopupWindowRef[] = getPopupRefs()): void {
  const run = () => {
    const live = getPopupRefs()
    syncStateToAll(live.length ? live : popups)
  }
  run()
  window.setTimeout(run, 50)
  window.setTimeout(run, 250)
  window.setTimeout(run, 800)
  window.setTimeout(run, 1500)
}

function tagPopupSlot(popup: PopupWindowRef, fallbackIndex: number): number {
  if (popup.__popupSlot) return popup.__popupSlot

  const fromName = parseSlotIndex(popup.name)
  popup.__popupSlot = fromName || fallbackIndex
  return popup.__popupSlot
}

function requestBoundsReport(popup: PopupWindowRef): void {
  if (!popup || popup.closed) return
  try {
    popup.postMessage(
      { action: 'report-bounds' } satisfies PopupActionPayload,
      window.location.origin,
    )
  } catch (error) {
    console.log(error)
  }
}

function saveOpenPopupLayouts(): void {
  getPopupRefs().forEach((popup, index) => {
    const slotId = getPopupSlotId(tagPopupSlot(popup, index + 1))
    const bounds = captureCurrentBounds(popup)
    if (bounds) saveSlotBounds(slotId, bounds)
  })
}

function ensurePopups(moduleId?: string): PopupWindowRef[] {
  const desiredCount = getPopupCount()
  let popups = getPopupRefs()

  popups.forEach((popup, index) => {
    tagPopupSlot(popup, index + 1)
  })

  if (popups.length > desiredCount) {
    saveOpenPopupLayouts()
    for (let i = desiredCount; i < popups.length; i++) {
      if (popups[i] && !popups[i].closed) {
        requestBoundsReport(popups[i])
        popups[i].close()
      }
    }
    popups = popups.slice(0, desiredCount)
  }

  for (let i = popups.length + 1; i <= desiredCount; i++) {
    const win = openPopupWindow(i, moduleId)
    if (win) {
      popups.push(win)
    }
  }

  popups = persistPopups(popups)

  popups.forEach((popup, arrayIndex) => {
    const slot = tagPopupSlot(popup, arrayIndex + 1)
    const entry = resolveBoundsForSlot(getPopupSlotId(slot))
    if (entry) {
      scheduleRestoreOnWindow(popup, entry)
    }
    requestBoundsReport(popup)
  })

  return popups
}

export function getPopupModule(): string {
  return getActiveModule()
}

export function isPopupModuleOpen(moduleId: string): boolean {
  return hasLivePopups() && getActiveModule() === moduleId
}

export function hasLivePopups(): boolean {
  return getPopupRefs().length > 0
}

export async function openPopupModule(moduleId: string): Promise<boolean> {
  await requestWindowManagementPermission()

  // Define o módulo antes de abrir, para a popup ler no boot (URL + storage).
  setActiveModule(moduleId)

  const popups = ensurePopups(moduleId)
  if (popups.length === 0) return false

  popups.forEach((popup) => {
    try {
      popup.focus()
    } catch {
      // ignore focus errors
    }
  })

  scheduleSync(popups)
  return true
}

export async function exitPopupModule(): Promise<void> {
  saveOpenPopupLayouts()
  setActiveModule('')
  scheduleSync()
}

export async function closeAllPopups(): Promise<void> {
  getPopupRefs().forEach((popup, index) => {
    const bounds = captureCurrentBounds(popup)
    if (bounds) {
      saveSlotBounds(getPopupSlotId(tagPopupSlot(popup, index + 1)), bounds)
    }
    if (popup && !popup.closed) {
      popup.close()
    }
  })
  persistPopups([])
  setActiveModule('')
}

export function syncPopupWindows(): PopupWindowRef[] {
  const popups = ensurePopups()
  scheduleSync(popups)
  return popups
}

export function handlePopupBoundsMessage(
  slotId: string,
  bounds: Parameters<typeof saveSlotBounds>[1],
): void {
  saveSlotBounds(slotId, bounds)
}

let openerBridgeInstalled = false

/** Escuta bounds reportados pelas janelas de projeção (legado). */
export function installPopupOpenerBridge(): void {
  if (openerBridgeInstalled || typeof window === 'undefined') return
  openerBridgeInstalled = true

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return

    const data = event.data as {
      action?: string
      slot?: string
      bounds?: Parameters<typeof saveSlotBounds>[1]
    } | null

    if (data?.action === 'popup-bounds' && data.slot && data.bounds) {
      handlePopupBoundsMessage(data.slot, data.bounds)
    }
  })
}
