import { describe, expect, it } from 'vitest'

import {
  filterAlbumMusicIndex,
  parseHymnalNumber,
} from './album-music-search'
import type { AlbumSearchHit } from '../types/albums'

const hit: AlbumSearchHit = {
  musicId: 42,
  name: 'Santo, Santo, Santo',
  track: 1,
  durationLabel: '',
  hasInstrumental: false,
  albumNames: 'Hinário Adventista',
  displayTitle: 'Santo, Santo, Santo',
  isHymnal: true,
  hymnalTracks: [1],
}

describe('busca de hinos', () => {
  it.each(['1', '001', 'H1', 'h 1', 'HA 1', 'hino 1'])(
    'extrai número de %s',
    (query) => expect(parseHymnalNumber(query)).toBe(1),
  )

  it('não trata número dentro de título como número de hinário', () => {
    expect(parseHymnalNumber('salmo 23')).toBeNull()
  })

  it('acha número e ignora acentos no título', () => {
    expect(filterAlbumMusicIndex([hit], 'hino 001')).toHaveLength(1)
    expect(filterAlbumMusicIndex([hit], 'santo santo')).toHaveLength(1)
  })
})
