import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

import { useBibleStore } from '@modules/bible/stores/useBibleStore'
import { useClockStore } from '@modules/clock/stores/useClockStore'
import { useCountdownStore } from '@modules/countdown/stores/useCountdownStore'
import { useLiturgyStore } from '@modules/liturgy/stores/useLiturgyStore'
import { useMediaStore } from '@modules/media/stores/useMediaStore'
import { useRandomStore } from '@modules/random/stores/useRandomStore'
import { useTimerStore } from '@modules/timer/stores/useTimerStore'

import { appConfirm } from './useAppConfirm'

/**
 * ESC na janela do operador fecha TODAS as projeções ativas com confirmação
 * (paridade app — decisão Rafael 30/08: projeção nunca fecha sem o operador
 * confirmar na tela DELE).
 *
 * Agrega os 7 módulos que projetam no web (media, bíblia, liturgia, timer,
 * countdown, clock, random). Cada store expõe seu próprio fechamento:
 * - media/random/timer/countdown/clock: clearProjection()
 * - bíblia: clearProjectionWindow()
 * - liturgia: clearWebProjection() (limpa runtime + popups + refs)
 */
export function useOperatorEscapeToCloseAllProjections(): void {
  const route = useRoute()
  let handling = false

  function collectActiveClosers(): Array<() => void | Promise<void>> {
    const closers: Array<() => void | Promise<void>> = []
    const media = useMediaStore()
    if (media.isProjecting) closers.push(() => media.clearProjection())

    const bible = useBibleStore()
    if (bible.isProjecting) closers.push(() => bible.clearProjectionWindow())

    const liturgy = useLiturgyStore()
    if (
      liturgy.siteProjectionItemId != null ||
      liturgy.videoProjectionItemId != null
    ) {
      closers.push(() => liturgy.clearWebProjection())
    }

    const random = useRandomStore()
    if (random.isProjecting) closers.push(() => random.clearProjection())

    const timer = useTimerStore()
    if (timer.isProjecting) closers.push(() => timer.clearProjection())

    const countdown = useCountdownStore()
    if (countdown.isProjecting) closers.push(() => countdown.clearProjection())

    const clock = useClockStore()
    if (clock.isProjecting) closers.push(() => clock.clearProjection())

    return closers
  }

  async function onKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.key !== 'Escape') return
    if (handling) return
    // Guard: ESC digitado dentro de input/textarea/contenteditable não é
    // intenção de fechar projeção.
    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }
    // Guard: dialog aberto já captura ESC — não empilhar confirm sobre confirm.
    if (document.querySelector('[role="dialog"]')) return

    const closers = collectActiveClosers()
    if (closers.length === 0) {
      // Sem projeção ativa: ESC na rota /media fecha o now playing
      // (requestClose abre o confirm existente; o close navega de volta).
      if (route.name === 'media') {
        useMediaStore().requestClose()
      }
      return
    }

    handling = true
    try {
      const ok = await appConfirm({
        title: 'Encerrar projeção?',
        message: 'Há uma projeção ativa. Encerrar agora?',
        confirmLabel: 'Encerrar',
        danger: true,
      })
      if (ok) {
        for (const close of closers) {
          await close()
        }
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
