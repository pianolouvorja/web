import { ref } from 'vue'

/**
 * WT-5c: sessão do Palco via relay cloud (piano-api), SEM desktop.
 *
 * Mesmo contrato de useDesktopPalcoSession — o card "TVs do Palco" consome
 * qualquer um dos dois sem saber a diferença. Diferenças:
 * - Conexão é WS direto do browser para a API (relay), não WebRemoteBridge.
 * - "TVs" são receivers conectados ao relay (role=receiver), não slots do
 *   palco-server do desktop. createTv/removeTv (gestão de slots) não existe
 *   na cloud — cada TV entra por conta própria com o código. As ações
 *   vira no-ops que retornam true (UI mantém botões, sem efeito).
 * - turnOn/turnOff/idle/project publicam estado no relay como operator.
 */

export interface PalcoSlotInfo {
  id: string
  label: string
  running: boolean
  clients: number
  httpPort: number
  wsPort: number
}

export interface PalcoStatusInfo {
  running: boolean
  clients: number
  url: string | null
  wsUrl: string | null
}

export interface StageRelayState {
  connected: import('vue').Ref<boolean>
  code: import('vue').Ref<string | null>
  attachCode: (code: string, apiBase?: string) => Promise<boolean>
  createSession: () => Promise<boolean>
  detach: () => void
  fetchStatus: () => Promise<PalcoStatusInfo | null>
  fetchSlots: () => Promise<PalcoSlotInfo[]>
  turnOn: () => Promise<boolean>
  turnOff: () => Promise<boolean>
  idle: () => Promise<boolean>
  createTv: (label: string) => Promise<boolean>
  removeTv: (id: string) => Promise<boolean>
  startTv: (id: string) => Promise<boolean>
  stopTv: (id: string) => Promise<boolean>
}

const connected = ref(false)
const code = ref<string | null>(null)
let ws: WebSocket | null = null
let apiBase = import.meta.env.DEV
  ? 'http://localhost:3100/v1/palco'
  : '/v1/palco'
let keepalive: ReturnType<typeof setInterval> | null = null
let lastState: PalcoStatusInfo | null = null
let receivers = 0

function resolveApi(httpBase: string): string {
  // http(s)://host/v1/palco → ws(s)://host/v1/palco
  return httpBase.replace(/^http/, 'ws')
}

async function bootstrapToken(c: string): Promise<string> {
  const http = apiBase.replace(/^ws/, 'http')
  const res = await fetch(`${http}/sessions/${encodeURIComponent(c)}/token`)
  if (!res.ok) throw new Error('sessao_nao_encontrada')
  const body = (await res.json()) as { token: string }
  return body.token
}

/**
 * Publica estado do operador no relay. Aceita objeto JS; é serializado
 * com o envelope do protocolo do receiver ({v:2, type:...}).
 */
export function publish(state: Record<string, unknown>): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ v: 2, ...state }))
  }
}

export function useStageRelay(): StageRelayState {
  async function attachCode(c: string, base?: string): Promise<boolean> {
    if (base) apiBase = base
    const clean = c.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length !== 6) return false
    try {
      const token = await bootstrapToken(clean)
      const url = `${resolveApi(apiBase)}/relay/${clean}?token=${encodeURIComponent(token)}&role=operator`
      ws = new WebSocket(url)
      ws.onopen = () => {
        connected.value = true
        code.value = clean
        retryMs = 1000
        startKeepalive()
      }
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as Record<string, unknown>
          if (msg.type === 'youare') {
            receivers = typeof msg.receivers === 'number' ? msg.receivers : receivers
          }
        } catch { /* ignora mensagem não-JSON */ }
      }
      ws.onclose = (ev) => {
        connected.value = false
        stopKeepalive()
        if (ev.code !== 4404 && ev.code !== 1000) scheduleReconnect()
      }
      ws.onerror = () => { /* onclose dispara depois */ }
      return true
    } catch {
      return false
    }
  }

  /**
   * WT-5 (fluxo completo): cria a sessão no relay (POST /v1/palco/sessions)
   * e já conecta como operator. Quem gera o código é o web operador — a TV
   * só consome. Sem isso o operador precisaria de curl pra iniciar o culto.
   */
  async function createSession(): Promise<boolean> {
    const http = apiBase.replace(/^ws/, 'http')
    try {
      const res = await fetch(`${http}/sessions`, { method: 'POST' })
      if (!res.ok) return false
      const body = (await res.json()) as { code: string }
      if (!body.code) return false
      return attachCode(body.code)
    } catch {
      return false
    }
  }

  let retryMs = 1000
  function scheduleReconnect(): void {
    const c = code.value
    if (!c) return
    setTimeout(() => { void attachCode(c) }, retryMs)
    retryMs = Math.min(retryMs * 2, 10000)
  }

  function startKeepalive(): void {
    stopKeepalive()
    keepalive = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ v: 2, type: 'ping' }))
    }, 20000)
  }
  function stopKeepalive(): void {
    if (keepalive) { clearInterval(keepalive); keepalive = null }
  }

  function detach(): void {
    stopKeepalive()
    if (ws) { try { ws.close(1000) } catch { /* já fechado */ } ws = null }
    connected.value = false
    code.value = null
    lastState = null
    receivers = 0
  }

  async function fetchStatus(): Promise<PalcoStatusInfo | null> {
    if (!connected.value) return null
    return { running: true, clients: receivers, url: code.value, wsUrl: null }
  }

  async function fetchSlots(): Promise<PalcoSlotInfo[]> {
    // Cloud: cada TV é um receiver direto — não há slots gerenciados.
    // Retorna 1 "slot virtual" por compatibilidade com o card.
    if (!connected.value) return []
    return [{
      id: '0',
      label: code.value ?? '',
      running: true,
      clients: receivers,
      httpPort: 0,
      wsPort: 0,
    }]
  }

  async function turnOn(): Promise<boolean> { publish({ type: 'idle', msg: 'Palco ligado' }); return connected.value }
  async function turnOff(): Promise<boolean> { publish({ type: 'idle', msg: '' }); return connected.value }
  async function idle(): Promise<boolean> { publish({ type: 'idle', msg: 'Aguardando conteúdo…' }); return connected.value }

  // Sem gestão de slots na cloud — cada TV entra/dentro sozinha com o código.
  async function createTv(): Promise<boolean> { return connected.value }
  async function removeTv(): Promise<boolean> { return connected.value }
  async function startTv(): Promise<boolean> { return connected.value }
  async function stopTv(): Promise<boolean> { return connected.value }

  return { connected, code, attachCode, createSession, detach, fetchStatus, fetchSlots, turnOn, turnOff, idle, createTv, removeTv, startTv, stopTv }
}

void lastState
