// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import { appConfirm } from '../useAppConfirm'
import { useOperatorEscapeToCloseProjection } from '../useOperatorEscapeToCloseProjection'

vi.mock('../useAppConfirm', () => ({ appConfirm: vi.fn() }))

describe('useOperatorEscapeToCloseProjection', () => {
  const isProjectionActive = vi.fn()
  const closeProjection = vi.fn()

  function mountHook() {
    return mount(
      defineComponent({
        setup() {
          useOperatorEscapeToCloseProjection({ isProjectionActive, closeProjection })
          return () => h('div')
        },
      }),
    )
  }

  beforeEach(() => {
    isProjectionActive.mockReset()
    closeProjection.mockReset()
    vi.mocked(appConfirm).mockReset()
  })

  it('confirma e fecha a projeção ao pressionar ESC', async () => {
    isProjectionActive.mockReturnValue(true)
    vi.mocked(appConfirm).mockResolvedValue(true)
    const wrapper = mountHook()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    await nextTick()

    expect(appConfirm).toHaveBeenCalledWith({
      title: 'Encerrar projeção?',
      message: 'Há uma projeção ativa. Encerrar agora?',
      confirmLabel: 'Encerrar',
      danger: true,
    })
    expect(closeProjection).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('não fecha se operador cancelar', async () => {
    isProjectionActive.mockReturnValue(true)
    vi.mocked(appConfirm).mockResolvedValue(false)
    const wrapper = mountHook()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    await nextTick()

    expect(closeProjection).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ignora ESC sem projeção ativa', async () => {
    isProjectionActive.mockReturnValue(false)
    const wrapper = mountHook()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(appConfirm).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ignora ESC digitado em input', async () => {
    isProjectionActive.mockReturnValue(true)
    const wrapper = mountHook()
    const input = document.createElement('input')
    document.body.appendChild(input)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(appConfirm).not.toHaveBeenCalled()
    input.remove()
    wrapper.unmount()
  })
})
