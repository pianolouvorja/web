export interface WebRemoteSnapshot {
  player: {
    hymnId?: number
    title?: string | null
    mode?: string
    playing: boolean
    positionMs: number
    durationMs: number
    slideIndex: number
    slideCount: number
    volume: number
    canPrevious: boolean
    canNext: boolean
  }
  liturgy: {
    selectedIndex: number | null
    items: Array<{
      index: number
      type: string
      title: string | null
      subtitle?: string | null
      isCategory?: boolean
      accentColor?: string | null
      done: boolean
    }>
  }
}

export interface WebRemoteCommand {
  id: string
  action: string
  value?: number
  positionMs?: number
  mode?: string
  hymnId?: number
}

export interface WebRemoteBridgeOptions {
  snapshot(): WebRemoteSnapshot
  execute(command: WebRemoteCommand): Promise<boolean>
  onClose?(): void
}

/** Ack estendido do desktop: pode trazer payload de queries (palco.status/slots). */
type AckMessage = { v: 1; type: 'ack'; id: string; ok: boolean; data?: unknown }

/**
 * Cliente do Controle Remoto (web público) para o Web Link do APK.
 *
 * Protocolo "LouvorJA Remote v1" — o mesmo envelope usado entre APK e
 * Electron (ver lib/core/services/remote/remote_protocol.dart no apk):
 * - `{v:1, type:'hello'|'state'|'command'|'ack'|'ping'|'pong'}`
 * - Estado é COMPLETO (não delta); envio na conexão e após cada comando.
 * - O APK é o controlador; o browser executa e reporta.
 *
 * Token de pareamento: extraído da URL de conexão (`host:port?t=TOKEN`) e
 * incluído em todo `command` — o remote-server do Electron desconecta
 * clientes que mandam comando sem token válido.
 */
export class WebRemoteBridge {
  private ws: WebSocket | null = null
  private stopped = false
  private token: string | null = null
  private pending = new Map<
    string,
    { resolve: (ack: { ok: boolean; data?: unknown }) => void; timer: ReturnType<typeof setTimeout> }
  >()

  constructor(
    private readonly url: string,
    private readonly options: WebRemoteBridgeOptions,
  ) {
    try {
      const qIndex = url.indexOf('?')
      if (qIndex >= 0) {
        const params = new URLSearchParams(url.slice(qIndex + 1))
        this.token = params.get('t') ?? params.get('token')
      }
    } catch {
      this.token = null
    }
  }

  start(): void {
    this.stopped = false
    this.ws = new WebSocket(this.url)
    this.ws.onopen = () => {
      this.send({ v: 1, type: 'hello', device: 'Piano LouvorJA Web' })
      this.reportState()
    }
    this.ws.onmessage = (event) => {
      void this.handle(String(event.data))
    }
    this.ws.onclose = () => {
      this.ws = null
      this.rejectAllPending()
      if (!this.stopped) this.options.onClose?.()
    }
    this.ws.onerror = () => this.ws?.close()
  }

  stop(): void {
    this.stopped = true
    this.ws?.close()
    this.ws = null
    this.rejectAllPending()
  }

  reportState(): void {
    this.send({ v: 1, type: 'state', ...this.options.snapshot() })
  }

  /**
   * Envia um comando AO DESKTOP (sentido inverso: web → app).
   * O remote-server do Electron valida o token e despacha ao renderer
   * (namespaces v2, incluindo palco.*).
   */
  sendCommand(action: string, payload: Record<string, unknown> = {}): void {
    this.send({
      v: 1,
      type: 'command',
      id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      ...(this.token ? { token: this.token } : {}),
      ...payload,
    })
  }

  /**
   * Comando com resposta: resolve quando o ack com o mesmo id chega.
   * Queries como `palco.status`/`palco.slots` trazem `data`.
   */
  request(
    action: string,
    payload: Record<string, unknown> = {},
    timeoutMs = 5000,
  ): Promise<{ ok: boolean; data?: unknown }> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        resolve({ ok: false })
        return
      }
      const id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const timer = setTimeout(() => {
        this.pending.delete(id)
        resolve({ ok: false })
      }, timeoutMs)
      this.pending.set(id, { resolve, timer })
      this.send({
        v: 1,
        type: 'command',
        id,
        action,
        ...(this.token ? { token: this.token } : {}),
        ...payload,
      })
    })
  }

  private resolvePending(id: string, ok: boolean, data?: unknown): void {
    const entry = this.pending.get(id)
    if (!entry) return
    this.pending.delete(id)
    clearTimeout(entry.timer)
    entry.resolve({ ok, data })
  }

  private rejectAllPending(): void {
    for (const [id, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.resolve({ ok: false })
      this.pending.delete(id)
    }
  }

  private async handle(raw: string): Promise<void> {
    let message: WebRemoteCommand & { v?: number; type?: string; ok?: boolean; data?: unknown }
    try {
      message = JSON.parse(raw) as WebRemoteCommand & { v?: number; type?: string; ok?: boolean; data?: unknown }
    } catch {
      return
    }
    if (message.v !== 1) return

    if (message.type === 'ack' && typeof message.id === 'string') {
      const ack = message as unknown as AckMessage
      this.resolvePending(ack.id, ack.ok === true, ack.data)
      return
    }

    if (message.type === 'ping') {
      this.send({ v: 1, type: 'pong' })
      return
    }
    if (message.type !== 'command' || !message.id || !message.action) return

    let ok = false
    try {
      ok = await this.options.execute(message)
    } catch {
      ok = false
    }
    this.send({ v: 1, type: 'ack', id: message.id, ok })
    this.reportState()
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(message))
  }
}
