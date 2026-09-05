// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Foco: electronMonitorIdForSlot injeta monitor=<displayId> nas features
// somente quando (a) bridge Electron presente, (b) slot atribuído a monitor.
const mocks = vi.hoisted(() => ({
  permission: vi.fn<() => Promise<void>>(),
  scheduleRestore: vi.fn(),
  getPopupCount: vi.fn(() => 1),
  getProjectionFullscreenMode: vi.fn(() => true),
  getTargetPopupSlots: vi.fn(() => [1]),
  getBrowserItem: vi.fn(() => ''),
  setBrowserItem: vi.fn(),
  refs: [] as Array<Window & { __popupSlot?: number }>,
}))

vi.mock('@shared/services/popup-layout', () => ({
  captureCurrentBounds: vi.fn(() => null),
  getControlOpenFeatures: vi.fn(() => ''),
  getOpenFeatures: vi.fn(() => 'width=800,height=600'),
  getPopupSlotId: (slot: number) => `PopupWindow${slot}`,
  LITURGY_CONTROL_LAYOUT_ID: 'LiturgyWebControl',
  parseSlotIndex: (name: string) => Number.parseInt(name.replace('PopupWindow', ''), 10) || null,
  requestWindowManagementPermission: mocks.permission,
  resolveBoundsForSlot: vi.fn(() => null),
  saveSlotBounds: vi.fn(),
  scheduleRestoreOnWindow: mocks.scheduleRestore,
}))

vi.mock('@shared/services/projection-preferences', () => ({
  getPopupCount: mocks.getPopupCount,
  getProjectionFullscreenMode: mocks.getProjectionFullscreenMode,
  getTargetPopupSlots: mocks.getTargetPopupSlots,
}))

vi.mock('../popup-routing', () => ({
  POPUP_ROUTABLE_MODULES: ['bible'],
  getPopupRoute: vi.fn(() => 'mirror'),
}))

// slot-monitors real sobre storage mockado (setBrowserItem alimenta getBrowserItem)
const storage = new Map<string, string>()
vi.mock('@shared/services/browser-storage', () => ({
  getBrowserItem: (key: string) => storage.get(key) ?? '',
  setBrowserItem: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
}))

vi.mock('./popup-registry', () => ({
  getPopupRefs: () => mocks.refs,
  setPopupRefs: (refs: Array<Window & { __popupSlot?: number }>) => {
    mocks.refs.splice(0, mocks.refs.length, ...refs)
    return refs
  },
}))

import { openPopupModule } from '../popup-windows'
import { assignScreenToSlot } from '@shared/services/slot-monitors'

function bridgeFor(value: unknown): void {
  Object.defineProperty(window, 'louvorja', { configurable: true, value })
}

describe('openPopupWindow > monitor=<displayId> no Electron', () => {
  beforeEach(() => {
    storage.clear()
    mocks.refs.length = 0
    mocks.permission.mockReset().mockResolvedValue()
    vi.stubGlobal('BroadcastChannel', class {
      postMessage() {}
      close() {}
    })
  })

  it('sem bridge Electron: features não recebem monitor=', async () => {
    bridgeFor(undefined)
    const popup = { closed: false, close: vi.fn(), focus: vi.fn(), postMessage: vi.fn() } as unknown as Window
    const open = vi.spyOn(window, 'open').mockImplementation(((_url: string, _name: string, features: string) => {
      expect(features).not.toContain('monitor=')
      return popup
    }) as typeof window.open)

    await openPopupModule('bible')
    open.mockRestore()
  })

  it('com bridge + slot atribuído: injeta monitor=<displayId>', async () => {
    const displays = [
      { id: 7, bounds: { x: 0, y: 0 } },
      { id: 42, bounds: { x: 1920, y: 0 } },
    ]
    bridgeFor({ isElectron: true, displays: { list: () => Promise.resolve(displays) } })

    const popup = { closed: false, close: vi.fn(), focus: vi.fn(), postMessage: vi.fn() } as unknown as Window
    const open = vi.spyOn(window, 'open').mockImplementation(((_url: string, _name: string, features: string) => {
      expect(features).toContain('monitor=42')
      return popup
    }) as typeof window.open)

    await openPopupModule('bible')
    open.mockRestore()
  })
})
