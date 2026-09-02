import { describe, expect, it } from 'vitest'
import { toReceiverMessage } from '../palco-cloud-bridge'

// WT-5 paridade visual: toda projection carrega os stage fields do módulo
// (fontSize/shadow/caixinha/cores/background) — os asserts usam
// expect.objectContaining nos campos de conteúdo.
describe('toReceiverMessage', () => {
  it('serializa bíblia no envelope de projeção v2 com stage fields', async () => {
    const msg = await toReceiverMessage('bible', { reference: 'João 3:16', text: 'Porque Deus amou...' })
    expect(msg).toMatchObject({
      v: 2,
      type: 'projection',
      footerRef: 'João 3:16',
      text: 'Porque Deus amou...',
    })
    // stage fields presentes (paridade visual com o popup)
    expect(msg).toHaveProperty('fontSize')
    expect(msg).toHaveProperty('textShadow')
    expect(msg).toHaveProperty('textBox')
    expect(msg).toHaveProperty('footerRefColor')
  })

  it('serializa hino ativo: letra no text, título no footer (paridade receiver TV)', async () => {
    const msg = await toReceiverMessage('media', { active: true, title: 'Santo, Santo, Santo', lyric: 'Senhor Deus dos exércitos', subtitle: '', isCover: false })
    expect(msg).toMatchObject({
      v: 2,
      type: 'projection',
      text: 'Senhor Deus dos exércitos',
      footer: 'Santo, Santo, Santo',
    })
    expect(msg).toHaveProperty('fontSize')
    // isCover: título vira o CONTEÚDO (grande), sem letra — paridade popup
    const cover = await toReceiverMessage('media', { active: true, title: 'Santo, Santo, Santo', lyric: 'x', isCover: true })
    expect(cover).toMatchObject({ v: 2, type: 'projection', text: 'Santo, Santo, Santo' })
    expect(cover).not.toHaveProperty('footer')
  })

  it('mídia inativa/sem letra → idle no receiver', async () => {
    expect((await toReceiverMessage('media', { active: false, title: 'X', lyric: 'Y' }))?.type).toBe('idle')
    expect((await toReceiverMessage('media', { active: true, title: 'X', lyric: '  ' }))?.type).toBe('idle')
  })

  it('serializa relógio como timer', async () => {
    expect(await toReceiverMessage('clock', { time: '10:30' })).toMatchObject({ v: 2, type: 'timer', text: '10:30' })
  })

  it.each(['timer', 'countdown'])('serializa %s como timer', async (moduleId) => {
    expect(await toReceiverMessage(moduleId, { display: '05:00' })).toMatchObject({ v: 2, type: 'timer', text: '05:00' })
  })

  it('retorna null para módulo desconhecido', async () => {
    expect(await toReceiverMessage('desconhecido', { display: '7' })).toBeNull()
  })
})
