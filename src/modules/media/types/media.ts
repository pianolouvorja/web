/** Stub até o módulo de mídia ser migrado — contrato usado pela liturgia. */
export type MediaPlaybackMode = 'audio' | 'instrumental' | 'no_audio'

export type MediaOpenResult =
  | { ok: true; warningKey?: string }
  | { ok: false; messageKey: string }
