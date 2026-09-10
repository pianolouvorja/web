import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getPopupRoute,
  getPopupRoutes,
  isCloudDestinationRoute,
  resolveSlotsForModule,
  setPopupRoute,
} from '../popup-routing'

describe('popup-routing (WT-4a — módulo por popup)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // isolar estado de localStorage entre testes
    localStorage.clear()
    // popup-routing lê localStorage no import; reprocessar defaults limpos
    vi.resetModules()
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

describe('isCloudDestinationRoute (WT-6A — destino sem popup local)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    vi.resetModules()
  })

  it("rota 'tv' é destino cloud (broadcast relay)", () => {
    setPopupRoute('media', 'tv')
    expect(isCloudDestinationRoute('media')).toBe(true)
  })

  it("rota 'palco:1' é destino cloud (receiver PWA slot 1)", () => {
    setPopupRoute('media', 'palco:1')
    expect(isCloudDestinationRoute('media')).toBe(true)
  })

  it("rota 'palco:32' é destino cloud (slot máximo)", () => {
    setPopupRoute('bible', 'palco:32')
    expect(isCloudDestinationRoute('bible')).toBe(true)
  })

  it("rota de slot numérico puro ('2') NÃO é destino cloud — popup local abre", () => {
    setPopupRoute('media', '2')
    expect(isCloudDestinationRoute('media')).toBe(false)
  })

  it("rota 'mirror' NÃO é destino cloud — popup local abre", () => {
    setPopupRoute('media', 'mirror')
    expect(isCloudDestinationRoute('media')).toBe(false)
  })

  it('qualquer módulo routável respeita a própria rota', () => {
    setPopupRoute('bible', 'palco:2')
    setPopupRoute('timer', 'mirror')
    expect(isCloudDestinationRoute('bible')).toBe(true)
    expect(isCloudDestinationRoute('timer')).toBe(false)
  })
})
