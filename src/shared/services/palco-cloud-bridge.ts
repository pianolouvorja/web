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

/** Serializa estados de projeção web para o protocolo do receiver cloud. */
export function toReceiverMessage(moduleId: string, payload: unknown): ReceiverMessage | null {
  if (moduleId === 'bible') {
    const reference = field(payload, 'reference')
    const text = field(payload, 'text')
    return reference === null || text === null ? null : { v: 2, type: 'projection', footerRef: reference, text }
  }

  if (moduleId === 'media') {
    const title = field(payload, 'title')
    if (title === null) return null
    return { v: 2, type: 'projection', text: title, footer: field(payload, 'artist') ?? '' }
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
