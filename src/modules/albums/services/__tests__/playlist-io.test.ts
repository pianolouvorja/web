import {
  parsePlaylistsImport,
  serializePlaylists,
  type PlaylistsExport,
} from '../playlist-io'
import type { Playlist } from '../playlist-storage'

function makePlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: 'pl-1',
    name: 'Culto',
    items: [{ musicId: 10, albumId: 2, title: 'Falar com Deus' }],
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z',
    ...overrides,
  }
}

describe('playlist-io', () => {
  describe('serializePlaylists', () => {
    it('produz envelope v1 com kind playlists', () => {
      const payload = serializePlaylists([makePlaylist()])
      expect(payload.version).toBe(1)
      expect(payload.kind).toBe('playlists')
      expect(payload.exported_at).toBeTruthy()
      expect(payload.playlists).toHaveLength(1)
      expect(payload.playlists[0]?.name).toBe('Culto')
    })

    it('nao compartilha referencia com a playlist original', () => {
      const original = makePlaylist()
      const payload = serializePlaylists([original])
      expect(payload.playlists[0]).not.toBe(original)
      expect(payload.playlists[0]?.items).not.toBe(original.items)
    })
  })

  describe('parsePlaylistsImport', () => {
    it('faz roundtrip serialize -> parse identico', () => {
      const payload = serializePlaylists([makePlaylist()])
      const result = parsePlaylistsImport(JSON.stringify(payload))
      expect(result.ok).toBe(true)
      expect(result.playlists).toEqual([makePlaylist()])
      expect(result.discardedItems).toBe(0)
    })

    it('rejeita JSON invalido', () => {
      const result = parsePlaylistsImport('nao-json{')
      expect(result.ok).toBe(false)
      expect(result.playlists).toEqual([])
    })

    it('rejeita objeto sem kind playlists', () => {
      const result = parsePlaylistsImport(JSON.stringify({ version: 1, foo: [] }))
      expect(result.ok).toBe(false)
    })

    it('rejeita envelope sem array de playlists', () => {
      const result = parsePlaylistsImport(
        JSON.stringify({ version: 1, kind: 'playlists', playlists: 'x' }),
      )
      expect(result.ok).toBe(false)
    })

    it('rejeita quando nenhuma playlist valida', () => {
      const payload: PlaylistsExport = {
        version: 1,
        exported_at: new Date().toISOString(),
        kind: 'playlists',
        playlists: [{ ...makePlaylist(), name: '  ' }],
      }
      const result = parsePlaylistsImport(JSON.stringify(payload))
      expect(result.ok).toBe(false)
    })

    it('descarta itens invalidos e mantem os validos', () => {
      const payload: PlaylistsExport = {
        version: 1,
        exported_at: new Date().toISOString(),
        kind: 'playlists',
        playlists: [
          {
            ...makePlaylist(),
            items: [
              { musicId: 1, albumId: null, title: 'Valida' },
              { musicId: 'x', albumId: null, title: 'Id invalido' },
              { musicId: 2, albumId: 3, title: '' },
              null,
            ] as Playlist['items'],
          },
        ],
      }
      const result = parsePlaylistsImport(JSON.stringify(payload))
      expect(result.ok).toBe(true)
      expect(result.playlists[0]?.items).toHaveLength(1)
      expect(result.discardedItems).toBe(3)
    })

    it('preenche createdAt/updatedAt ausentes', () => {
      const payload: PlaylistsExport = {
        version: 1,
        exported_at: new Date().toISOString(),
        kind: 'playlists',
        playlists: [
          { id: 'pl-2', name: 'Sem datas', items: [] } as unknown as Playlist,
        ],
      }
      const result = parsePlaylistsImport(JSON.stringify(payload))
      expect(result.ok).toBe(true)
      expect(result.playlists[0]?.createdAt).toBeTruthy()
      expect(result.playlists[0]?.updatedAt).toBeTruthy()
    })

    it('trim do nome da playlist', () => {
      const payload = serializePlaylists([makePlaylist({ name: '  Espacos  ' })])
      const result = parsePlaylistsImport(JSON.stringify(payload))
      expect(result.playlists[0]?.name).toBe('Espacos')
    })
  })
})
