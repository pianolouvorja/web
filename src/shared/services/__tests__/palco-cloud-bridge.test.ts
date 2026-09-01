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

  it('serializa hino ativo: letra no text, título no footer (paridade receiver TV)', () => {
    expect(toReceiverMessage('media', { active: true, title: 'Santo, Santo, Santo', lyric: 'Senhor Deus dos exércitos', subtitle: '' })).toEqual({
      v: 2,
      type: 'projection',
      text: 'Senhor Deus dos exércitos',
      footer: 'Santo, Santo, Santo',
    })
  })

  it('mídia inativa/sem letra → idle no receiver', () => {
    expect(toReceiverMessage('media', { active: false, title: 'X', lyric: 'Y' })?.type).toBe('idle')
    expect(toReceiverMessage('media', { active: true, title: 'X', lyric: '  ' })?.type).toBe('idle')
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
