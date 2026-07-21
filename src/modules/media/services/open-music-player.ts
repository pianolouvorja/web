import type { MediaOpenResult, MediaPlaybackMode } from '../types/media'

export type OpenMusicPlayerParams = {
  musicId: number
  mode: MediaPlaybackMode
  albumId?: number | null
  project?: boolean
}

/**
 * Stub web: módulo Álbuns/Mídia ainda não migrado.
 * Mantém o contrato de nomes para a liturgia.
 */
export async function openMusicPlayer(
  _params: OpenMusicPlayerParams,
): Promise<MediaOpenResult> {
  return { ok: false, messageKey: 'liturgy.messages.musicModuleUnavailable' }
}
