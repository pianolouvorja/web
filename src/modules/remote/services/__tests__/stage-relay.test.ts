import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  publish,
  useStageRelay,
} from '../stage-relay'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static OPEN = 1
  static CONNECTING = 0
  static CLOSING = 2
  static CLOSED = 3
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onclose: ((ev: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  constructor(public url: string) { FakeWebSocket.instances.push(this) }
  send(data: string): void { this.sent.push(data) }
  close(_code?: number): void { this.readyState = 3; this.onclose?.({ code: 1000 }) }
  // helpers de teste
  serverOpen(): void { this.readyState = 1; this.onopen?.() }
  serverMessage(data: unknown): void { this.onmessage?.({ data: JSON.stringify(data) }) }
}

vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket)

const fetchMock = vi.fn(async (url: string | URL) => {
  const u = String(url)
  if (u.includes('/sessions/ABC234/token')) {
    return { ok: true, json: async () => ({ token: 'tok-abc' }) } as Response
  }
  return { ok: false, json: async () => ({}) } as Response
})
vi.stubGlobal('fetch', fetchMock)

describe('stage-relay (WT-5c)', () => {
  let relay: ReturnType<typeof useStageRelay>

  beforeEach(() => {
    vi.useFakeTimers()
    FakeWebSocket.instances = []
    fetchMock.mockClear()
    relay = useStageRelay()
  })

  afterEach(() => {
    relay.detach()
    vi.useRealTimers()
  })

  it('attachCode normaliza e valida o código', async () => {
    expect(await relay.attachCode('ab-c234')).toBe(true)
    expect(FakeWebSocket.instances[0].url).toContain('/relay/ABC234?token=tok-abc&role=operator')
    expect(await relay.attachCode('ABCDE')).toBe(false) // 5 chars
    expect(await relay.attachCode('ZZZZZZ')).toBe(false) // token 404
  })

  it('createSession cria sessão na API e conecta como operator', async () => {
    fetchMock.mockImplementationOnce(async () =>
      ({ ok: true, json: async () => ({ code: 'XYZ789' }) }) as Response)
    fetchMock.mockImplementationOnce(async () =>
      ({ ok: true, json: async () => ({ token: 'tok-xyz' }) }) as Response)
    expect(await relay.createSession()).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/sessions'),
      expect.objectContaining({ method: 'POST' }),
    )
    FakeWebSocket.instances[0].serverOpen()
    expect(relay.connected.value).toBe(true)
    expect(relay.code.value).toBe('XYZ789')
  })

  it('createSession falha graciosamente se a API não cria a sessão', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, json: async () => ({}) }) as Response)
    expect(await relay.createSession()).toBe(false)
    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('onopen conecta e expõe o código', async () => {
    await relay.attachCode('ABC234')
    const sock = FakeWebSocket.instances[0]
    sock.serverOpen()
    expect(relay.connected.value).toBe(true)
    expect(relay.code.value).toBe('ABC234')
  })

  it('fetchSlots retorna slot virtual com clients do youare', async () => {
    await relay.attachCode('ABC234')
    const sock = FakeWebSocket.instances[0]
    sock.serverOpen()
    sock.serverMessage({ v: 2, type: 'youare', receivers: 3 })
    const slots = await relay.fetchSlots()
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject({ id: '0', clients: 3, running: true })
  })

  it('publish envia envelope v2 pelo WS aberto', async () => {
    await relay.attachCode('ABC234')
    const sock = FakeWebSocket.instances[0]
    sock.serverOpen()
    publish({ type: 'projection', text: 'Glória a Deus' })
    expect(sock.sent[0]).toBe(JSON.stringify({ v: 2, type: 'projection', text: 'Glória a Deus' }))
  })

  it('turnOn/turnOff/idle publicam estado e refletem conexão', async () => {
    await relay.attachCode('ABC234')
    const sock = FakeWebSocket.instances[0]
    sock.serverOpen()
    expect(await relay.turnOn()).toBe(true)
    expect(sock.sent.at(-1)).toContain('"type":"idle"')
    sock.onclose?.({ code: 1000 })
    sock.readyState = 3
    expect(await relay.turnOff()).toBe(false)
  })

  it('createTv/removeTv/startTv/stopTv são no-ops que refletem conexão', async () => {
    await relay.attachCode('ABC234')
    const sock = FakeWebSocket.instances[0]
    sock.serverOpen()
    expect(await relay.createTv('TV 2')).toBe(true)
    expect(await relay.removeTv('1')).toBe(true)
    expect(sock.sent).toHaveLength(0)
  })

  it('reconexão com backoff após close inesperado', async () => {
    await relay.attachCode('ABC234')
    const first = FakeWebSocket.instances[0]
    first.serverOpen()
    first.readyState = 3
    first.onclose?.({ code: 1006 })
    expect(relay.connected.value).toBe(false)
    await vi.advanceTimersByTimeAsync(1000)
    // 2º WebSocket criado (reconexão)
    expect(FakeWebSocket.instances.length).toBe(2)
  })

  it('sessão inválida (4404) NÃO reconecta', async () => {
    await relay.attachCode('ABC234')
    const first = FakeWebSocket.instances[0]
    first.serverOpen()
    first.onclose?.({ code: 4404 })
    await vi.advanceTimersByTimeAsync(30000)
    expect(FakeWebSocket.instances.length).toBe(1)
  })

  it('detach fecha WS e limpa estado', async () => {
    await relay.attachCode('ABC234')
    const sock = FakeWebSocket.instances[0]
    sock.serverOpen()
    relay.detach()
    expect(relay.connected.value).toBe(false)
    expect(relay.code.value).toBeNull()
  })
})
