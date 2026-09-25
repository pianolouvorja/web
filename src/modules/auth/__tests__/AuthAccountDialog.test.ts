// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AuthAccountDialog from '../components/AuthAccountDialog.vue'

// Mock dos componentes Vuetify: stubs simples sem CSS real (v-dialog teleporta pro body).
vi.mock('vuetify/components', () => ({
  VBtn: { template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>' },
  VCard: { template: '<div v-bind="$attrs"><slot /></div>' },
  VCardText: { template: '<div v-bind="$attrs"><slot /></div>' },
  VCardTitle: { template: '<div v-bind="$attrs"><slot /></div>' },
  VCardActions: { template: '<div v-bind="$attrs"><slot /></div>' },
  VDialog: {
    props: { modelValue: Boolean },
    template: '<div v-if="modelValue" v-bind="$attrs"><slot /></div>',
  },
  VIcon: { template: '<i v-bind="$attrs"><slot /></i>' },
  VTextField: {
    props: { modelValue: { type: String, default: '' }, label: String, type: String },
    emits: ['update:modelValue'],
    template: `<input :type="type || 'text'" :placeholder="label" :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)" />`,
  },
  VForm: { template: '<form v-bind="$attrs" @submit.prevent><slot /></form>' },
  VSpacer: { template: '<span />' },
}))

vi.mock('../composables/useAuth', () => ({
  useAuth: () => ({
    session: ref(null),
    isLoggedIn: { value: false },
    userName: { value: '' },
    userEmail: { value: '' },
    login: vi.fn(async () => true),
    register: vi.fn(async () => true),
    loginGoogle: vi.fn(async () => true),
    logout: vi.fn(async () => {}),
    forgotPassword: vi.fn(async () => true),
    resetPassword: vi.fn(async () => true),
  }),
}))

const i18n = createI18n({ legacy: false, messages: { pt: {} } })

function mountDialog(modelValue = true) {
  return mount(AuthAccountDialog, {
    props: { modelValue },
    global: { plugins: [i18n] },
  })
}

describe('AuthAccountDialog (RF-001: abre do header)', () => {
  it('renderiza o formulario de login quando aberto (modelValue=true)', () => {
    const wrapper = mountDialog(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('nao renderiza nada quando fechado (modelValue=false)', () => {
    const wrapper = mountDialog(false)
    expect(wrapper.find('input[type="email"]').exists()).toBe(false)
  })

  it('tem botao Entrar com Google (RF-002)', () => {
    const wrapper = mountDialog(true)
    expect(wrapper.text()).toContain('Entrar com Google')
  })
})
