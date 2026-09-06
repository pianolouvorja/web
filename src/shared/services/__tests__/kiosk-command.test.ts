import { describe, expect, it } from 'vitest'
import { kioskCommandFor } from '../kiosk-command'

const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
const UA_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
const UA_LINUX = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'

const URL_RECEIVER = 'https://api.exemplo/palco/?code=ABC123'
const BASE = 'https://api.exemplo'

describe('kioskCommandFor', () => {
  it('windows: comando PowerShell inline com .cmd do túnel', () => {
    const r = kioskCommandFor(UA_WIN, URL_RECEIVER, BASE)
    expect(r.so).toBe('windows')
    expect(r.viaPowerShell).toBe(true)
    expect(r.comando).toContain('palco-kiosk.cmd')
    expect(r.comando).toContain(URL_RECEIVER)
    expect(r.comando).not.toContain('curl')
  })

  it('macos: comando bash com .sh (sem --all — sem xrandr)', () => {
    const r = kioskCommandFor(UA_MAC, URL_RECEIVER, BASE)
    expect(r.so).toBe('macos')
    expect(r.comando).toContain('curl')
    expect(r.comando).toContain('palco-kiosk.sh')
    expect(r.comando).not.toContain('--all')
  })

  it('linux: comando bash com .sh --all (xrandr)', () => {
    const r = kioskCommandFor(UA_LINUX, URL_RECEIVER, BASE)
    expect(r.so).toBe('linux')
    expect(r.comando).toContain('--all')
  })

  it('url do receiver é preservada em todos os SOs', () => {
    for (const ua of [UA_WIN, UA_MAC, UA_LINUX]) {
      expect(kioskCommandFor(ua, URL_RECEIVER, BASE).comando).toContain(URL_RECEIVER)
    }
  })
})
