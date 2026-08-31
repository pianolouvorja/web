// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

import { useOperatorEscapeToCloseAllProjections } from '../useOperatorEscapeToCloseAllProjections'

const mocks = vi.hoisted(() => ({
  media: { isProjecting: false, clearProjection: vi.fn() },
  bible: { isProjecting: false, clearProjectionWindow: vi.fn() },
  random: { isProjecting: false, clearProjection: vi.fn() },
  timer: { isProjecting: false, clearProjection: vi.fn() },
  countdown: { isProjecting: false, clearProjection: vi.fn() },
  clock: { isProjecting: false, clearProjection: vi.fn() },
  liturgy: {
    isProjecting: false,
    clearWebProjection: vi.fn(),
  },
}))

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia')
  return { ...actual }
})

vi.mock('@modules/media/stores/useMediaStore', () => ({
  useMediaStore: () => mocks.media,
}))
vi.mock('@modules/bible/stores/useBibleStore', () => ({
  useBibleStore: () => mocks.bible,
}))
vi.mock('@modules/random/stores/useRandomStore', () => ({
  useRandomStore: () => mocks.random,
}))
vi.mock('@modules/timer/stores/useTimerStore', () => ({
  useTimerStore: () => mocks.timer,
}))
vi.mock('@modules/countdown/stores/useCountdownStore', () => ({
  useCountdownStore: () => mocks.countdown,
}))
vi.mock('@modules/clock/stores/useClockStore', () => ({
  useClockStore: () => mocks.clock,
}))
vi.mock('@modules/liturgy/stores/useLiturgyStore', () => ({
  useLiturgyStore: () => mocks.liturgy,
}))

vi.mock('@shared/services/popup-windows', () => ({
  hasScreenPopups: vi.fn(() => false),
}))

vi.mock('../useAppConfirm', () => ({ appConfirm: vi.fn() }))

import { appConfirm } from '../useAppConfirm'
import { hasScreenPopups } from '@shared/services/popup-windows'

function mountHook() {
  return mount(
    defineComponent({
      setup() {
        useOperatorEscapeToCloseAllProjections()
        return () => h('div')
      },
    }),
    { global: { plugins: [createPinia()] } },
  )
}

function pressEscape(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(appConfirm).mockReset()
  for (const group of Object.values(mocks)) {
    for (const value of Object.values(group)) {
      if (typeof value === 'function') value.mockReset()
      else if (typeof value === 'boolean') group.isProjecting = false
    }
  }
  vi.mocked(hasScreenPopups).mockReturnValue(false)
})

describe('useOperatorEscapeToCloseAllProjections', () => {
  it('não abre confirm sem nenhuma projeção ativa', async () => {
    const wrapper = mountHook()

    pressEscape()
    await vi.waitFor(() => {})

    expect(appConfirm).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('confirma e fecha TODAS as projeções ativas', async () => {
    mocks.media.isProjecting = true
    mocks.bible.isProjecting = true
    mocks.liturgy.isProjecting = true
    mocks.liturgy.siteProjectionItemId = 3
    vi.mocked(appConfirm).mockResolvedValue(true)
    const wrapper = mountHook()

    pressEscape()
    await vi.waitFor(() => expect(appConfirm).toHaveBeenCalled())
    await vi.waitFor(() => {
      expect(mocks.media.clearProjection).toHaveBeenCalledOnce()
      expect(mocks.bible.clearProjectionWindow).toHaveBeenCalledOnce()
      expect(mocks.liturgy.clearWebProjection).toHaveBeenCalledOnce()
    })
    wrapper.unmount()
  })

  it('não fecha nada se operador cancelar', async () => {
    mocks.media.isProjecting = true
    mocks.timer.isProjecting = true
    vi.mocked(appConfirm).mockResolvedValue(false)
    const wrapper = mountHook()

    pressEscape()
    await vi.waitFor(() => expect(appConfirm).toHaveBeenCalled())
    await vi.waitFor(() => {})
    expect(mocks.media.clearProjection).not.toHaveBeenCalled()
    expect(mocks.timer.clearProjection).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ignora ESC dentro de input/textarea', async () => {
    mocks.media.isProjecting = true
    const wrapper = mountHook()
    const input = document.createElement('input')
    document.body.appendChild(input)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await vi.waitFor(() => {})

    expect(appConfirm).not.toHaveBeenCalled()
    input.remove()
    wrapper.unmount()
  })

  it('ignora ESC com dialog aberto (evita confirm sobre confirm)', async () => {
    mocks.media.isProjecting = true
    const wrapper = mountHook()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.appendChild(dialog)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => {})

    expect(appConfirm).not.toHaveBeenCalled()
    dialog.remove()
    wrapper.unmount()
  })

  it('remove o listener ao desmontar', async () => {
    mocks.media.isProjecting = true
    const wrapper = mountHook()
    wrapper.unmount()

    pressEscape()
    await vi.waitFor(() => {})

    expect(appConfirm).not.toHaveBeenCalled()
  })
})
