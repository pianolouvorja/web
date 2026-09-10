import { describe, expect, it } from 'vitest'
import { buildSlja, parseSlja } from './slja'

describe('slja (compatibilidade LouvorJA Delphi)', () => {
  it('gera e le ZIP .slja com slides.lja, áudio e imagens', async () => {
    const archive = await buildSlja({
      title: 'Meu Hino',
      audio: { name: 'meu-hino.mp3', bytes: new Uint8Array([1, 2, 3]) },
      slides: [
        { lyric: 'Meu Hino', type: 'CAPA', timeMs: 0, backgroundColor: '#000000' },
        {
          lyric: 'Primeira linha\nSegunda linha',
          auxiliaryLyric: 'Auxiliar',
          type: 'LETRA',
          timeMs: 83000,
          textColor: '#efb400',
          image: { name: 'bg.jpg', bytes: new Uint8Array([4, 5]) },
        },
      ],
    })

    const parsed = await parseSlja(archive)
    expect(parsed.title).toBe('Meu Hino')
    expect(parsed.audio?.name).toBe('meu-hino.mp3')
    expect(parsed.slides).toHaveLength(2)
    expect(parsed.slides[1]).toMatchObject({
      lyric: 'Primeira linha\nSegunda linha',
      auxiliaryLyric: 'Auxiliar',
      type: 'LETRA',
      timeMs: 83000,
      textColor: '#efb400',
    })
    expect(parsed.slides[1]?.image?.name).toBe('bg.jpg')
  })

  it('lê o formato INI legado com pipe, tempo_hms e paths Windows', async () => {
    const ini = `[Geral]\nslides=2\nurl_musica=audio\\hino.mp3\naudio=1\n\n[Slide:1]\ntipo=CAPA\nletra=Título\n\n[Slide:2]\ntipo=LETRA\nletra=Uma|Duas\nletra_aux=One|Two\ntempo=999999\ntempo_hms=00:01:23\nimagem=imagens\\fundo.jpg\ncor_letra=#FFFFFF\n`
    const archive = await buildSlja({
      title: 'placeholder',
      rawIni: ini,
      audio: { name: 'hino.mp3', bytes: new Uint8Array([1]) },
      assets: [{ path: 'imagens/fundo.jpg', bytes: new Uint8Array([2]) }],
      slides: [],
    })
    const parsed = await parseSlja(archive)

    expect(parsed.slides[1]).toMatchObject({
      lyric: 'Uma\nDuas',
      auxiliaryLyric: 'One\nTwo',
      timeMs: 83000,
      textColor: '#FFFFFF',
    })
    expect(parsed.audio?.name).toBe('hino.mp3')
  })
})
