import { beforeEach, describe, expect, it } from 'vitest'

import { getLayoutEntry } from '../popup-layout'
import {
  assignScreenToSlot,
  clearScreenAssignment,
  findSlotForScreen,
  pickSlotForScreen,
} from '../slot-monitors'

const monitor = {
  id: '2560:472',
  label: 'LG ULTRAWIDE',
  left: 2560,
  top: 472,
  width: 2560,
  height: 1080,
  isPrimary: true,
  isInternal: false,
}

describe('slot-monitors', () => {
  beforeEach(() => localStorage.clear())

  it('atribui monitor a slot e persiste bounds físicos', () => {
    assignScreenToSlot('2', monitor)
    expect(findSlotForScreen(monitor.id)).toBe('2')
    expect(getLayoutEntry('PopupWindow2')).toMatchObject({
      left: 2560, top: 472, width: 2560, height: 1080,
    })
  })

  it('reutiliza slot do monitor, depois usa primeiro livre', () => {
    assignScreenToSlot('2', monitor)
    expect(pickSlotForScreen(monitor.id, 3)).toBe('2')
    expect(pickSlotForScreen('0:0', 3)).toBe('1')
  })

  it('limpar remove rota física e bounds', () => {
    assignScreenToSlot('2', monitor)
    clearScreenAssignment('2')
    expect(findSlotForScreen(monitor.id)).toBeNull()
    expect(getLayoutEntry('PopupWindow2')).toBeNull()
  })
})
