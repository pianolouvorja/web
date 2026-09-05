import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getPopupRoute,
  getPopupRoutes,
  resolveSlotsForModule,
  setPopupRoute,
} from '../popup-routing'

describe('popup-routing (WT-4a — módulo por popup)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('default é mirror para todos os módulos', () => {
    expect(getPopupRoute('media')).toBe('mirror')
    expect(getPopupRoute('bible')).toBe('mirror')
  })

  it('setPopupRoute persiste e o get devolve o slot', () => {
    setPopupRoute('bible', '2')
    expect(getPopupRoute('bible')).toBe('2')
    expect(getPopupRoute('media')).toBe('mirror')
    expect(getPopupRoutes().bible).toBe('2')
  })

  it('mirror devolve undefined (todas as popups)', () => {
    expect(resolveSlotsForModule('media', [1, 2])).toBeUndefined()
  })

  it('rota individual devolve o slot designado', () => {
    setPopupRoute('bible', '2')
    expect(resolveSlotsForModule('bible', [1, 2])).toEqual([2])
  })

  it('rota para slot indisponível cai no primeiro slot disponível', () => {
    setPopupRoute('bible', '3')
    expect(resolveSlotsForModule('bible', [1, 2])).toEqual([1])
  })
})
