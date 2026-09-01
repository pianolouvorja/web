export type ReceiverMessage = {
  v: 2
  type: string
  text?: string
  footer?: string
  footerRef?: string
}

function field(payload: unknown, name: string): string | null {
  if (!payload || typeof payload !== 'object') return null
  const value = (payload as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : null
}

/**
 * Publica o estado do módulo no relay cloud (WT-5), se houver sessão ativa.
 * Sem sessão (modo local/desktop) é no-op — BroadcastChannel dos popups
 * continua sendo o caminho principal do browser.
 * best-effort: nunca lança, falha de rede não pode derrubar o runtime.
 */
export function publishToStageRelay(moduleId: string, payload: unknown): void {
  try {
    // import dinâmico: evita dependência circular (stage-relay → nada daqui)
    void import('@modules/remote/services/stage-relay').then(({ publish }) => {
      const msg = toReceiverMessage(moduleId, payload)
      if (msg) publish(msg as unknown as Record<string, unknown>)
    })
  } catch {
    // relay indisponível — projeção local segue
  }
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

  if (moduleId === 'timer' || moduleId === 'countdown') {
    const display = field(payload, 'display')
    return display === null ? null : { v: 2, type: 'timer', text: display }
  }

  return null
}
