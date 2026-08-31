// @vitest-environment jsdom
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

import { useLiturgyVideoAutoclose } from '../composables/useLiturgyVideoAutoclose'
import {
  publishLiturgyWebRuntime,
  clearLiturgyWebRuntime,
  type LiturgyWebProjectionRuntime,
} from '../services/liturgy-web-runtime'

vi.mock('../services/liturgy-web-runtime', () => ({
  publishLiturgyWebRuntime: vi.fn(),
  clearLiturgyWebRuntime: vi.fn(),
  DEFAULT_LITURGY_WEB_RUNTIME: {
    active: false,
    kind: 'none',
    url: '',
    urls: [],
    videoId: '',
    title: '',
    projectingScreens: false,
  },
}))

function makeRuntime(overrides: Partial<LiturgyWebProjectionRuntime> = {}) {
  return ref<LiturgyWebProjectionRuntime>({
    active: true,
    kind: 'video',
    url: 'blob:fake',
    urls: [],
    videoId: '',
    title: 'V',
    projectingScreens: true,
    ...overrides,
  })
}

function mountHook(runtime: ReturnType<typeof makeRuntime>, isControl = false) {
  return mount(
    defineComponent({
      setup() {
        useLiturgyVideoAutoclose({ runtime, isControl: ref(isControl) })
        return () => undefined
      },
    }),
  )
}

function handle(runtime: ReturnType<typeof makeRuntime>) {
  const h = (runtime.value as LiturgyWebProjectionRuntime & {
    __autoclose?: {
      onLocalVideoEnded: () => void
      handleYtStateChange: (state: number) => void
    }
  }).__autoclose
  if (!h) throw new Error('__autoclose nao anexado')
  return h
}

beforeEach(() => {
  vi.mocked(publishLiturgyWebRuntime).mockClear()
  vi.mocked(clearLiturgyWebRuntime).mockClear()
  // jsdom: window.close() destrói o document e mata os testes seguintes
  vi.stubGlobal('close', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLiturgyVideoAutoclose', () => {
  it('vídeo local ended: publica runtime inativo e fecha a popup', () => {
    const runtime = makeRuntime({ kind: 'video', url: 'blob:meu-video' })
    const wrapper = mountHook(runtime)

    handle(runtime).onLocalVideoEnded()

    expect(publishLiturgyWebRuntime).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    )
    wrapper.unmount()
  })

  it('controle NÃO autoclose no ended (quem fecha é a popup)', () => {
    const runtime = makeRuntime({ kind: 'video' })
    const wrapper = mountHook(runtime, true)

    handle(runtime).onLocalVideoEnded()

    expect(publishLiturgyWebRuntime).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('yt ENDED (state 0) no controle encerra a projeção', async () => {
    const runtime = makeRuntime({ kind: 'youtube' })
    const wrapper = mountHook(runtime, true)

    handle(runtime).handleYtStateChange(0)
    await nextTick()

    expect(clearLiturgyWebRuntime).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('yt fora do controle: ENDED não encerra', () => {
    const runtime = makeRuntime({ kind: 'youtube' })
    const wrapper = mountHook(runtime, false)

    handle(runtime).handleYtStateChange(0)

    expect(clearLiturgyWebRuntime).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('yt PLAYING/PAUSED não fecham nada', () => {
    const runtime = makeRuntime({ kind: 'youtube' })
    const wrapper = mountHook(runtime, true)

    handle(runtime).handleYtStateChange(1)
    handle(runtime).handleYtStateChange(2)

    expect(clearLiturgyWebRuntime).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
