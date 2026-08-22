import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import ptBR from '@locales/pt-BR'

// --- Mocks (devem vir ANTES de qualquer import do componente) ---

// Mock Vuetify VBtn para evitar import de CSS
vi.mock('vuetify/components', () => ({
  VBtn: {
    name: 'VBtn',
    emits: ['click'],
    props: { variant: String, size: String, disabled: Boolean },
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
}))

// Mock design-system GlassCard
vi.mock('@design-system/index', () => ({
  GlassCard: {
    name: 'GlassCard',
    template: '<div class="glass-card-stub"><slot /></div>',
  },
}))

// Mock useEula
const mockAccept = vi.fn()
const mockDecline = vi.fn()

vi.mock('@shared/composables/useEula', () => ({
  useEula: () => ({
    isAccepted: { value: false },
    accept: mockAccept,
    decline: mockDecline,
    currentVersion: 1,
  }),
}))

// Mock do EULA text raw import
vi.mock('../../../docs/LEGAL/eula/pt-BR.txt?raw', () => ({
  default: 'Mocked EULA full text for testing purposes',
}))

// Importar DEPOIS dos mocks
import EulaDialog from '../EulaDialog.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'pt-BR',
  messages: { 'pt-BR': ptBR },
})

const globalConfig = {
  plugins: [i18n],
  stubs: {
    Teleport: {
      template: '<div class="teleport-stub"><slot /></div>',
    },
  },
}

function makeWrapper() {
  return mount(EulaDialog, { global: globalConfig })
}

describe('EulaDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Renderizacao ---

  it('renderiza o titulo da licenca', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Licença')
  })

  it('renderiza o texto completo do EULA', () => {
    const wrapper = makeWrapper()
    // O vitest resolve ?raw imports nativamente (nao respeita vi.mock)
    expect(wrapper.text()).toContain('Licença de Uso do Software')
    expect(wrapper.text()).toContain('Copyright')
  })

  it('mostra botao Aceito e Nao aceito', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Aceito')
    expect(wrapper.text()).toContain('Não aceito')
  })

  // --- Scroll enforcement ---

  it('mostra dica de scroll quando nao rolou ate o fim', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Role para baixo')
  })

  it('botao Aceito fica desabilitado antes de rolar ate o fim', () => {
    const wrapper = makeWrapper()
    const acceptBtn = wrapper.findAll('button').find((b) => b.text().includes('Aceito'))
    expect(acceptBtn?.attributes('disabled')).toBeDefined()
  })

  it('botao Aceito habilita apos rolar ate o fim', async () => {
    const wrapper = makeWrapper()
    const textArea = wrapper.find('[role="region"]')

    Object.defineProperty(textArea.element, 'scrollHeight', { configurable: true, value: 500 })
    Object.defineProperty(textArea.element, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(textArea.element, 'scrollTop', { configurable: true, value: 100 })

    await textArea.trigger('scroll')

    const acceptBtn = wrapper.findAll('button').find((b) => b.text().includes('Aceito'))
    expect(acceptBtn?.attributes('disabled')).toBeUndefined()
  })

  // --- Accept flow ---

  it('chama accept() quando botao Aceito e clicado', async () => {
    const wrapper = makeWrapper()
    const textArea = wrapper.find('[role="region"]')

    Object.defineProperty(textArea.element, 'scrollHeight', { configurable: true, value: 500 })
    Object.defineProperty(textArea.element, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(textArea.element, 'scrollTop', { configurable: true, value: 100 })
    await textArea.trigger('scroll')

    const acceptBtn = wrapper.findAll('button').find((b) => b.text().includes('Aceito'))
    await acceptBtn?.trigger('click')

    expect(mockAccept).toHaveBeenCalledTimes(1)
  })

  // --- Decline flow ---

  it('mostra dialog de confirmacao ao clicar Nao aceito', async () => {
    const wrapper = makeWrapper()
    const declineBtn = wrapper.findAll('button').find((b) => b.text().includes('Não aceito'))

    await declineBtn?.trigger('click')

    expect(wrapper.text()).toContain('Tem certeza?')
    expect(wrapper.text()).toContain('Sim, recusar')
    expect(wrapper.text()).toContain('Voltar')
  })

  it('volta para o EULA ao clicar Voltar na confirmacao', async () => {
    const wrapper = makeWrapper()
    const declineBtn = wrapper.findAll('button').find((b) => b.text().includes('Não aceito'))
    await declineBtn?.trigger('click')

    const backBtn = wrapper.findAll('button').find((b) => b.text() === 'Voltar')
    await backBtn?.trigger('click')

    expect(wrapper.text()).toContain('Licença')
    expect(wrapper.text()).not.toContain('Tem certeza?')
  })

  it('mostra tela de saida e chama decline() ao clicar Sim recusar', async () => {
    const wrapper = makeWrapper()
    const declineBtn = wrapper.findAll('button').find((b) => b.text().includes('Não aceito'))
    await declineBtn?.trigger('click')

    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Sim, recusar'))
    await confirmBtn?.trigger('click')

    expect(mockDecline).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('não aceitou')
  })

  // --- Acessibilidade ---

  it('tem role=dialog e aria-modal=true', () => {
    const wrapper = makeWrapper()
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
  })

  it('tem aria-labelledby apontando para eula-title', () => {
    const wrapper = makeWrapper()
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-labelledby')).toBe('eula-title')
    const title = wrapper.find('#eula-title')
    expect(title.exists()).toBe(true)
  })

  it('area de texto tem role=region com aria-label correto', () => {
    const wrapper = makeWrapper()
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toContain('licença')
  })

  // --- onScroll edge cases (100% branch coverage) ---

  it('onScroll com isBottom=false mantem botao desabilitado', async () => {
    const wrapper = makeWrapper()
    const textArea = wrapper.find('[role="region"]')

    // scrollHeight - scrollTop - clientHeight >= 4 (nao esta no fim)
    Object.defineProperty(textArea.element, 'scrollHeight', { configurable: true, value: 1000 })
    Object.defineProperty(textArea.element, 'clientHeight', { configurable: true, value: 200 })
    Object.defineProperty(textArea.element, 'scrollTop', { configurable: true, value: 100 })

    await textArea.trigger('scroll')

    const acceptBtn = wrapper.findAll('button').find((b) => b.text().includes('Aceito'))
    expect(acceptBtn?.attributes('disabled')).toBeDefined()
  })
})
