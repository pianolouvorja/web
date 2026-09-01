import { describe, expect, it } from 'vitest'
import { toReceiverMessage } from '../palco-cloud-bridge'

describe('toReceiverMessage', () => {
  it('serializa bíblia no envelope de projeção v2', () => {
    expect(toReceiverMessage('bible', { reference: 'João 3:16', text: 'Porque Deus amou...' })).toEqual({
      v: 2,
      type: 'projection',
      footerRef: 'João 3:16',
      text: 'Porque Deus amou...',
    })
  })

  it('serializa mídia sem footerRef de versículo', () => {
    expect(toReceiverMessage('media', { title: 'Santo, Santo, Santo', artist: 'Hinário Adventista' })).toEqual({
      v: 2,
      type: 'projection',
      text: 'Santo, Santo, Santo',
      footer: 'Hinário Adventista',
    })
  })

  it('serializa relógio como timer', () => {
    expect(toReceiverMessage('clock', { time: '10:30' })).toEqual({ v: 2, type: 'timer', text: '10:30' })
  })

  it.each(['timer', 'countdown'])('serializa %s como timer', (moduleId) => {
    expect(toReceiverMessage(moduleId, { display: '05:00' })).toEqual({ v: 2, type: 'timer', text: '05:00' })
  })

  it('retorna null para módulo desconhecido', () => {
    expect(toReceiverMessage('random', { display: '7' })).toBeNull()
  })
})
