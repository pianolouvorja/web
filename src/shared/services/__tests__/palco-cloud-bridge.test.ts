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

// ===== Aceite WT-5f: personalização do palco na BÍBLIA via relay =====
// Condições: (1) bg idêntico ao configurado, (2) font-size idêntico,
// (3) toda personalização aplicada quando houver, (4) sem personalização
// nada extra é aplicado (defaults = o que o popup mostra).
describe('toReceiverMessage — bíblia: aceite de personalização do palco', () => {
  it('C2: bibleFontSize/bibleFontWeight/bibleTextColor do escopo bible chegam na TV (não os do hino)', async () => {
    localStorage.setItem('user_data', JSON.stringify({
      'stage.settings.bible': { bg: '#112233', size: 96, bSize: 110, bWeight: 700, bFg: '#FFE9A8' },
    }))
    const msg = await toReceiverMessage('bible', { reference: 'Sl 23:1', text: 'O Senhor é o meu pastor' })
    expect(msg).toMatchObject({ fontSize: 110, fontWeight: 700, textColor: '#FFE9A8' })
  })

  it('C1: bg oficial configurado no escopo bible chega na TV como URL ABSOLUTA carregável', async () => {
    localStorage.setItem('user_data', JSON.stringify({
      'stage.settings.bible': { bg: '#0A0E1A', bgImg: 'official:bg-01' },
    }))
    const msg = await toReceiverMessage('bible', { reference: 'Sl 23:1', text: 'O Senhor é o meu pastor' })
    // TV roda em file:// ou outra origem — path relativo é inacessível.
    expect(msg?.background).toMatch(/^https?:\/\/|^\/\//)
  })

  it('C1: data URL (upload do usuário) do escopo bible passa direto', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo='
    localStorage.setItem('user_data', JSON.stringify({
      'stage.settings.bible': { bgImg: dataUrl },
    }))
    const msg = await toReceiverMessage('bible', { reference: 'Sl 23:1', text: 'x' })
    expect(msg?.background).toBe(dataUrl)
  })

  it('C1: sem bg configurado no escopo bible, NÃO vai background (cor pinta a TV)', async () => {
    localStorage.removeItem('user_data')
    const msg = await toReceiverMessage('bible', { reference: 'Sl 23:1', text: 'x' })
    expect(msg).not.toHaveProperty('background')
    expect(msg).toMatchObject({ backgroundColor: '#0A0E1A' }) // default do palco
  })

  it('C3: alinhamentos + footerRef (cor/peso) do escopo bible chegam na TV', async () => {
    localStorage.setItem('user_data', JSON.stringify({
      'stage.settings.bible': { tAlign: 'right', tVAlign: 'bottom', refColor: '#00C1E6', refWeight: 400 },
    }))
    const msg = await toReceiverMessage('bible', { reference: 'Jo 3:16', text: 'x' })
    expect(msg).toMatchObject({ textAlign: 'right', textVerticalAlign: 'bottom', footerRefColor: '#00C1E6', footerWeight: 400 })
  })

  it('C3: showBibleVersion=false → footerRef sai da TV (popup também esconde)', async () => {
    localStorage.setItem('user_data', JSON.stringify({
      'stage.settings.bible': { showVer: false },
    }))
    const msg = await toReceiverMessage('bible', { reference: 'Jo 3:16', text: 'x' })
    expect(msg).not.toHaveProperty('footerRef')
  })

  it('C4: sem personalização nenhuma, mensagem carrega exatamente os DEFAULTS do palco', async () => {
    localStorage.removeItem('user_data')
    const msg = await toReceiverMessage('bible', { reference: 'Gn 1:1', text: 'No princípio' })
    expect(msg).toMatchObject({
      fontSize: 84, // DEFAULT_STAGE_SETTINGS.bibleFontSize
      fontWeight: 500,
      textColor: '#FFFFFF',
      textShadow: true,
      textBox: false,
      backgroundColor: '#0A0E1A',
      textAlign: 'center',
      textVerticalAlign: 'middle',
    })
  })
})
