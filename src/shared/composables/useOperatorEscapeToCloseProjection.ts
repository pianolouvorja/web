import { onMounted, onUnmounted } from 'vue'

import { appConfirm } from './useAppConfirm'

/**
 * ESC na janela do OPERADOR fecha a projeção com confirmação (paridade app,
 * decision 30/08: a projeção nunca fecha sem o operador confirmar).
 *
 * Web: "projeção ativa" = popups de tela vivos (hasScreenPopups). Fechar =
 * clearProjection do store de media OU callback injetado (módulos usam
 * seus próprios fluxos — bíblia/liturgia passam o próprio close).
 */
export function useOperatorEscapeToCloseProjection(options: {
  isProjectionActive: () => boolean
  closeProjection: () => void
}): void {
  let handling = false

  async function onKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.key !== 'Escape') return
    if (handling) return
    // Guard: ESC digitado dentro de input/textarea/contenteditable não é intenção de fechar
    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }
    // Guard: dialog aberto já captura ESC — não empilhar confirm sobre confirm
    if (document.querySelector('[role="dialog"]')) return
    if (!options.isProjectionActive()) return

    handling = true
    try {
      const ok = await appConfirm({
        title: 'Encerrar projeção?',
        message: 'Há uma projeção ativa. Encerrar agora?',
        confirmLabel: 'Encerrar',
        danger: true,
      })
      if (ok) {
        options.closeProjection()
      }
    } finally {
      handling = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
}
