// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  permission: vi.fn<() => Promise<void>>(),
  scheduleRestore: vi.fn(),
  getPopupCount: vi.fn(() => 1),
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
  getTargetPopupSlots: mocks.getTargetPopupSlots,
}))

vi.mock('@shared/services/browser-storage', () => ({
  getBrowserItem: mocks.getBrowserItem,
  setBrowserItem: mocks.setBrowserItem,
}))

vi.mock('./popup-registry', () => ({
  getPopupRefs: () => mocks.refs,
  setPopupRefs: (refs: Array<Window & { __popupSlot?: number }>) => {
    mocks.refs.splice(0, mocks.refs.length, ...refs)
    return refs
  },
}))

import { openPopupModule } from '../popup-windows'

describe('openPopupModule > Window Management', () => {
  beforeEach(() => {
    mocks.refs.length = 0
    mocks.permission.mockReset().mockResolvedValue()
    mocks.scheduleRestore.mockReset()
    mocks.getPopupCount.mockReturnValue(1)
    mocks.getTargetPopupSlots.mockReturnValue([1])
    vi.stubGlobal('BroadcastChannel', class {
      postMessage() {}
      close() {}
    })
  })

  it('solicita Window Management antes de abrir a popup para preservar o gesto do operador', async () => {
    const popup = { closed: false, name: 'PopupWindow1', focus: vi.fn(), postMessage: vi.fn() } as unknown as Window
    const open = vi.spyOn(window, 'open').mockReturnValue(popup)

    await openPopupModule('media')

    expect(mocks.permission).toHaveBeenCalledOnce()
    expect(open).toHaveBeenCalledOnce()
    expect(mocks.permission.mock.invocationCallOrder[0]).toBeLessThan(
      open.mock.invocationCallOrder[0],
    )

    open.mockRestore()
  })
})
