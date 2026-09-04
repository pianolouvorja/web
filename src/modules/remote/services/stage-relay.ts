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
// WT-5G: base da API configurável p/ testes remotos (túnel) — query
// ?palcoApi=https://tunnel/v1/palco ou localStorage 'palcoApiBase' vence.
// Default: localhost em dev, same-origin em prod.
function resolveDefaultApiBase(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('palcoApi')
    if (q) return q
    const stored = localStorage.getItem('palcoApiBase')
    if (stored) return stored
  } catch { /* SSR/privacy mode */ }
  const configured = import.meta.env.VITE_PALCO_API_URL
  if (configured) return `${configured.replace(/\/$/, '')}/v1/palco`
  return import.meta.env.DEV
    ? 'http://localhost:3100/v1/palco'
    : '/v1/palco'
}
let apiBase = resolveDefaultApiBase()
let keepalive: ReturnType<typeof setInterval> | null = null
let lastState: PalcoStatusInfo | null = null
let receivers = 0
// WT-5: TVs individualmente conectadas (youare.receiverList do relay)
interface ReceiverEntry { id: string; label: string }
let receiverList: ReceiverEntry[] = []

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

const SESSION_CODE_KEY = 'palcoOperatorSession'

/**
 * WT-5: reconecta automaticamente na última sessão (reload do navegador não
 * pode desparear operador e TV durante o culto). Retorna true se reconectou.
 */
export async function attachStoredSession(): Promise<boolean> {
  try {
    const stored = localStorage.getItem(SESSION_CODE_KEY)
    if (!stored || !/^[A-Z0-9]{6}$/.test(stored)) return false
    // AppShell e ScreensCard podem montar na mesma sessão; não abre outro WS.
    if (connected.value && code.value === stored) return true
    return await useStageRelay().attachCode(stored)
  } catch {
    return false
  }
}

/**
 * WT-5 áudio: espelha play/pause/seek/stop do áudio pro receiver TV
 * (case 'audio' do receiver — sincroniza positionMs antes do play).
 * Sem exclusividade de módulo: áudio acompanha a projection do hino.
 * Sem socket ou fora de sessão: no-op silencioso.
 */
export function publishAudio(payload: {
  action: 'play' | 'pause' | 'stop'
  url?: string
  title?: string
  subtitle?: string
  cover?: string
  positionMs?: number
}): void {
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN || !code.value) return
    ws.send(JSON.stringify({ v: 2, type: 'audio', ...payload }))
  } catch { /* relay indisponível — áudio local segue */ }
}

export function useStageRelay(): StageRelayState {
  // WT-5 race fix: attachCode é async (token) — dois attach em voo (ex. usuário
  // conecta código novo enquanto reconnect da sessão velha dispara) faziam o
  // handler antigo ganhar e o operator publicava na ROOM ERRADA (caso real
  // 01/09: code.value=RWL4AA, WS aberto em JB5YXU). attachGen identifica o
  // attach mais recente; eventos de geração morta são ignorados.
  let attachGen = 0
  async function attachCode(c: string, base?: string): Promise<boolean> {
    if (base) apiBase = base
    const clean = c.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length !== 6) return false
    const gen = ++attachGen
    stopKeepalive()
    if (ws) {
      // órfão: desliga handlers do socket anterior antes de abrir o novo
      ws.onopen = null
      ws.onmessage = null
      ws.onclose = null
      ws.onerror = null
      try { ws.close(1000) } catch { /* já fechado */ }
      ws = null
    }
    connected.value = false
    try {
      const token = await bootstrapToken(clean)
      // cid estável: servidor reconhece a reconexão e limpa o socket morto
      // (sem cid, reconexão tomava 4409 operator_already_present em loop).
      let cid = ''
      try { cid = localStorage.getItem('palcoOperatorCid') ?? '' } catch { /* storage restrito */ }
      if (!cid) {
        cid = `op-${Math.random().toString(36).slice(2, 10)}`
        try { localStorage.setItem('palcoOperatorCid', cid) } catch { /* ignore */ }
      }
      const url = `${resolveApi(apiBase)}/relay/${clean}?token=${encodeURIComponent(token)}&role=operator&cid=${encodeURIComponent(cid)}`
      ws = new WebSocket(url)
      ws.onopen = () => {
        if (gen !== attachGen) return
        connected.value = true
        code.value = clean
        retryMs = 1000
        startKeepalive()
        // Sessão persiste o reload do navegador — operator reconecta sozinho.
        try { localStorage.setItem(SESSION_CODE_KEY, clean) } catch { /* ignore */ }
        // WT-5: registra o send NESTA instância do módulo — o bridge consome
        // via window (Vite em dev duplica módulos com ?t= e o import estático
        // do bridge pegava instância connected:false — hinos não projetavam).
        ;(window as unknown as { __palcoRelaySend?: (s: Record<string, unknown>) => void }).__palcoRelaySend =
          (state) => { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ v: 2, ...state })) }
        ;(window as unknown as { __palcoRelayAudio?: (a: Record<string, unknown>) => void }).__palcoRelayAudio =
          (audio) => { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ v: 2, type: 'audio', ...audio })) }
      }
      ws.onmessage = (ev) => {
        if (gen !== attachGen) return
        try {
          const msg = JSON.parse(ev.data as string) as Record<string, unknown>
          if (msg.type === 'youare') {
            receivers = typeof msg.receivers === 'number' ? msg.receivers : receivers
            if (Array.isArray(msg.receiverList)) {
              receiverList = (msg.receiverList as ReceiverEntry[]).map((r) => ({
                id: String(r.id),
                label: String(r.label ?? r.id),
              }))
            }
          }
        } catch { /* ignora mensagem não-JSON */ }
      }
      ws.onclose = (ev) => {
        if (gen !== attachGen) return
        connected.value = false
        stopKeepalive()
        try { delete (window as unknown as { __palcoRelaySend?: unknown }).__palcoRelaySend } catch { /* ignore */ }
        try { delete (window as unknown as { __palcoRelayAudio?: unknown }).__palcoRelayAudio } catch { /* ignore */ }
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
    const genAtSchedule = attachGen
    setTimeout(() => {
      // sessão mudou desde o agendamento? reconnect antigo não roda
      if (genAtSchedule === attachGen) void attachCode(c)
    }, retryMs)
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
    // detach é intencional (botão encerrar) — sessão não volta no reload
    try { localStorage.removeItem(SESSION_CODE_KEY) } catch { /* ignore */ }
    if (ws) { try { ws.close(1000) } catch { /* já fechado */ } ws = null }
    connected.value = false
    code.value = null
    lastState = null
    receivers = 0
    receiverList = []
  }

  async function fetchStatus(): Promise<PalcoStatusInfo | null> {
    if (!connected.value) return null
    return { running: true, clients: receivers, url: code.value, wsUrl: null }
  }

  async function fetchSlots(): Promise<PalcoSlotInfo[]> {
    // Cloud: UMA entrada por TV realmente conectada — sem slot fantasma.
    // Nenhuma TV conectada = lista vazia (o card mostra o estado vazio).
    if (!connected.value) return []
    return receiverList.map((r) => ({
      id: r.id,
      label: r.label,
      running: true,
      clients: 1,
      httpPort: 0,
      wsPort: 0,
    }))
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
