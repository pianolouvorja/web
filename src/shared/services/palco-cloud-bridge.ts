import * as popupRouting from '@shared/services/popup-routing'

export type ReceiverMessage = {
  v: 2
  type: string
  text?: string
  footer?: string
  footerRef?: string
}

/**
 * Registro global do send do relay — evita import estático do stage-relay.
 * Em dev, o Vite cria MÚLTIPLAS instâncias do módulo (?t= do HMR), cada uma
 * com seu próprio `ws`; o bridge importava uma instância connected:false e
 * o publish ia pro limbo (hinos/utilitários não projetavam na TV, caso real
 * 01/09). O stage-relay se registra aqui no attach — instância única.
 */
type RelaySend = (state: Record<string, unknown>) => void
declare global {
  interface Window {
    __palcoRelaySend?: RelaySend
  }
}

function field(payload: unknown, name: string): string | null {
  if (!payload || typeof payload !== 'object') return null
  const value = (payload as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : null
}

let lastRelayModule: string | null = null

/**
 * WT-5 exclusividade: a TV mostra UM módulo por vez (padrão do palco).
 * Ao publicar um módulo diferente do ativo, manda idle ANTES — o conteúdo
 * anterior sai da tela sem o operador precisar desligar (esquecidinhos).
 * Clock: emite a cada segundo e apagaria o módulo ativo da TV — só publica
 * se clock é o ativo OU a rota dele é 'tv' (destino explícito).
 */
export function publishToStageRelay(moduleId: string, payload: unknown): void {
  try {
    const send = typeof window !== 'undefined' ? window.__palcoRelaySend : undefined
    if (!send) return // sem relay registrado (modo local/desktop ou instância dev)
    if (moduleId === 'clock' && lastRelayModule !== 'clock') {
      try {
        const { getPopupRoute } = popupRouting
        if (getPopupRoute('clock') !== 'tv') return
      } catch { /* routing indisponível — segue o fluxo */ }
    }
    if (lastRelayModule && lastRelayModule !== moduleId) {
      send({ v: 2, type: 'idle', msg: '' })
    }
    lastRelayModule = moduleId
    const msg = toReceiverMessage(moduleId, payload)
    if (msg) send(msg as unknown as Record<string, unknown>)
    else if (moduleId === lastRelayModule) lastRelayModule = null
  } catch {
    // relay indisponível — projeção local segue
  }
}

/** Reset (detach/encerrar sessão) — próximo publish não compara com estado morto. */
export function resetStageRelayModule(): void {
  lastRelayModule = null
}

/** Serializa estados de projeção web para o protocolo do receiver cloud. */
export function toReceiverMessage(moduleId: string, payload: unknown): ReceiverMessage | null {
  if (moduleId === 'bible') {
    const reference = field(payload, 'reference')
    const text = field(payload, 'text')
    if (reference === null || text === null) return null
    if (!text.trim()) return { v: 2, type: 'idle', msg: '' }
    return { v: 2, type: 'projection', footerRef: reference, text }
  }

  if (moduleId === 'media') {
    const active = (payload as Record<string, unknown> | null)?.active === true
    const lyric = field(payload, 'lyric')
    if (!active || lyric === null || !lyric.trim()) {
      return { v: 2, type: 'idle', msg: 'Aguardando conteúdo…' }
    }
    return {
      v: 2,
      type: 'projection',
      text: lyric,
      footer: field(payload, 'title') ?? '',
      ...(field(payload, 'subtitle') ? { footerRef: field(payload, 'subtitle') as string } : {}),
    }
  }

  if (moduleId === 'clock') {
    const time = field(payload, 'time')
    return time === null ? null : { v: 2, type: 'timer', text: time }
  }

  if (moduleId === 'random') {
    const display = field(payload, 'currentDisplay')
    if (display === null) return null
    if (!display.trim()) return { v: 2, type: 'idle', msg: 'Aguardando conteúdo…' }
    return { v: 2, type: 'projection', text: display }
  }

  if (moduleId === 'timer' || moduleId === 'countdown') {
    const display = field(payload, 'display')
    return display === null ? null : { v: 2, type: 'timer', text: display }
  }

  return null
}
