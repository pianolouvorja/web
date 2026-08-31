import { watch, type Ref } from 'vue'

import {
  DEFAULT_LITURGY_WEB_RUNTIME,
  clearLiturgyWebRuntime,
  publishLiturgyWebRuntime,
  type LiturgyWebProjectionRuntime,
} from '../services/liturgy-web-runtime'

/**
 * Autoclose de mídia com fim natural na projeção web da liturgia
 * (paridade app — regra 24/08: toda mídia COM fim fecha a projeção
 * sozinha; mídia sem fim — imagens/slides/PDF — não).
 *
 * - Vídeo local (kind 'video'): popup escuta `ended` no <video>,
 *   publica runtime inativo (controle atualiza botões via runtimeChannel)
 *   e fecha a própria janela.
 * - YouTube: o player vive no CONTROLE; ENDED (state 0) no controle
 *   encerra a projeção inteira (telas + runtime).
 * - Vimeo: embed sem Player API não emite fim — fora do escopo até
 *   integração com o player JS do Vimeo (documentado na SPEC RF-03).
 */
export function useLiturgyVideoAutoclose(options: {
  runtime: Ref<LiturgyWebProjectionRuntime>
  isControl: Ref<boolean>
}): void {
  /** Chamado pelo @ended do <video> local na JANELA DE TELA (popup). */
  function onLocalVideoEnded(): void {
    if (options.isControl.value) return
    try {
      if (options.runtime.value.url.startsWith('blob:')) {
        URL.revokeObjectURL(options.runtime.value.url)
      }
    } catch {
      // url já revogada
    }
    publishLiturgyWebRuntime({ ...DEFAULT_LITURGY_WEB_RUNTIME })
    try {
      window.close()
    } catch {
      // popup pode negar close programático — runtime inativo já limpa a UI
    }
  }

  /** Chamado pelo onStateChange do player YT no CONTROLE. */
  function handleYtStateChange(state: number): void {
    // 0 = ENDED (YT.PlayerState.ENDED)
    if (state !== 0) return
    if (!options.isControl.value) return
    clearLiturgyWebRuntime()
  }

  // Exposição p/ a view ligar nos eventos do <video> e do player YT.
  const host = options.runtime.value as LiturgyWebProjectionRuntime & {
    __autoclose?: {
      onLocalVideoEnded: () => void
      handleYtStateChange: (state: number) => void
    }
  }
  host.__autoclose = { onLocalVideoEnded, handleYtStateChange }

  // Se o runtime virou inativo vindо da popup, o CONTROLE encerra as telas.
  watch(
    () => options.runtime.value.active,
    (active) => {
      if (active) return
      if (!options.isControl.value) return
      if (options.runtime.value.projectingScreens) {
        clearLiturgyWebRuntime()
      }
    },
  )
}
