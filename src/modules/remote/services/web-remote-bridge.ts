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

/**
 * Cliente do Controle Remoto (web público) para o Web Link do APK.
 *
 * Protocolo "LouvorJA Remote v1" — o mesmo envelope usado entre APK e
 * Electron (ver lib/core/services/remote/remote_protocol.dart no apk):
 * - `{v:1, type:'hello'|'state'|'command'|'ack'|'ping'|'pong'}`
 * - Estado é COMPLETO (não delta); envio na conexão e após cada comando.
 * - O APK é o controlador; o browser executa e reporta.
 */
export class WebRemoteBridge {
  private ws: WebSocket | null = null
  private stopped = false

  constructor(
    private readonly url: string,
    private readonly options: WebRemoteBridgeOptions,
  ) {}

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
      if (!this.stopped) this.options.onClose?.()
    }
    this.ws.onerror = () => this.ws?.close()
  }

  stop(): void {
    this.stopped = true
    this.ws?.close()
    this.ws = null
  }

  reportState(): void {
    this.send({ v: 1, type: 'state', ...this.options.snapshot() })
  }

  /**
   * Envia um comando AO DESKTOP (sentido inverso: web → app).
   * O remote-server do Electron trata `command` com token e despacha
   * ao renderer (namespaces v2, incluindo palco.*).
   */
  sendCommand(action: string, payload: Record<string, unknown> = {}): void {
    this.send({
      v: 1,
      type: 'command',
      id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      ...payload,
    })
  }

  private async handle(raw: string): Promise<void> {
    let message: WebRemoteCommand & { v?: number; type?: string }
    try {
      message = JSON.parse(raw) as WebRemoteCommand & { v?: number; type?: string }
    } catch {
      return
    }
    if (message.v !== 1) return

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
