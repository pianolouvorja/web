import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearSlotBounds,
  getProjectionFullscreenBounds,
  getPopupSlotId,
  saveSlotBounds,
} from '../popup-layout'

describe('popup-layout monitor assignment', () => {
  beforeEach(() => localStorage.clear())

  it('usa bounds persistidos do monitor ao abrir o slot', () => {
    saveSlotBounds(getPopupSlotId(1), {
      left: 2560,
      top: 472,
      width: 2560,
      height: 1080,
      screenLeft: 2560,
      screenTop: 472,
      screenWidth: 2560,
      screenHeight: 1080,
    })

    expect(getProjectionFullscreenBounds(1)).toEqual({
      left: 2560,
      top: 472,
      width: 2560,
      height: 1080,
    })
  })

  it('limpa bounds ao desfazer atribuição', () => {
    saveSlotBounds(getPopupSlotId(1), { left: 2560, top: 472, width: 2560, height: 1080 })
    clearSlotBounds(getPopupSlotId(1))

    expect(JSON.parse(localStorage.getItem('louvorja_popup_layout') ?? '{}')).not.toHaveProperty('PopupWindow1')
  })
})
