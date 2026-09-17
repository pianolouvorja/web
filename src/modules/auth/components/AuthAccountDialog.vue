<script setup lang="ts">
/**
 * Barra de conta para coletâneas custom — login/registro simples (e-mail + senha).
 * Compacto: quando logado mostra só nome + botão sair; senão formulário colapsável.
 * Inclui fluxo "esqueci minha senha": pede token via /auth/forgot-password
 * (o token chega pelo suporte quando sem SMTP) e troca a senha em /auth/reset-password.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'

const { t } = useI18n()

const props = defineProps<{
  /** Dialog/overlay pai controla a abertura. */
  modelValue: boolean
  /** Título customizado (opcional). */
  title?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { session, isLoggedIn, userName, userEmail, login, register, logout, forgotPassword, resetPassword } = useAuth()

const formOpen = ref(true)
const mode = ref<'login' | 'register' | 'forgot' | 'reset'>('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const resetToken = ref('')
const busy = ref(false)

const isValid = computed(() => {
  if (mode.value === 'forgot') return email.value.includes('@')
  if (mode.value === 'reset') {
    return resetToken.value.trim().length >= 16 && password.value.length >= 8
  }
  if (email.value.includes('@') === false) return false
  if (password.value.length < 6) return false
  if (mode.value === 'register' && displayName.value.trim().length < 2) return false
  return true
})

async function onSubmit(): Promise<void> {
  if (!isValid.value || busy.value) return
  busy.value = true
  try {
    if (mode.value === 'forgot') {
      await forgotPassword(email.value)
      if (resetToken.value) {
        mode.value = 'reset'
      } else {
        mode.value = 'login'
      }
      return
    }
    if (mode.value === 'reset') {
      const ok = await resetPassword(resetToken.value, password.value)
      if (ok) {
        mode.value = 'login'
        password.value = ''
        resetToken.value = ''
      }
      return
    }
    const ok = mode.value === 'login'
      ? await login(email.value, password.value)
      : await register(email.value, password.value, displayName.value)
    if (ok) {
      formOpen.value = false
      password.value = ''
      emit('update:modelValue', false)
    }
  } finally {
    busy.value = false
  }
}

async function onLogout(): Promise<void> {
  await logout()
  formOpen.value = false
  emit('update:modelValue', false)
}

function toggleForm(): void {
  formOpen.value = !formOpen.value
  if (!formOpen.value) {
    password.value = ''
    resetToken.value = ''
    mode.value = 'login'
    emit('update:modelValue', false)
  }
}

function close(): void {
  formOpen.value = false
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog v-model="formOpen" :max-width="420" persistent>
    <v-card class="pa-4" elevation="8">
      <div class="d-flex align-center justify-space-between mb-4">
        <v-btn variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <div class="text-h6 font-weight-medium">{{ t('auth.title') }}</div>
        <div style="width: 32px" />
      </div>

      <template v-if="session">
        <!-- Logado: nome + sair -->
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-1 font-weight-medium" :title="userEmail">
            {{ userName }}
          </span>
          <v-btn variant="outlined" size="small" @click="onLogout">
            {{ t('auth.logout') }}
          </v-btn>
        </div>
      </template>

      <template v-else>
        <!-- Deslogado: formulário colapsável -->
        <form @submit.prevent="onSubmit">
          <!-- LOGIN -->
          <template v-if="mode === 'login'">
            <v-text-field
              v-model="email"
              :label="t('auth.email')"
              type="email"
              :autocomplete="'email'"
              :rules="[v => !!v || t('auth.emailRequired'), v => v?.includes('@') || t('auth.emailInvalid')]"
              :disabled="busy"
            />
            <v-text-field
              v-model="password"
              :label="t('auth.password')"
              type="password"
              :autocomplete="'current-password'"
              :rules="[v => !!v || t('auth.passwordRequired'), v => (v?.length ?? 0) >= 6 || t('auth.passwordMin')]"
              :disabled="busy"
            />
            <v-btn
              :disabled="!isValid || busy"
              block
              color="primary"
              type="submit"
            >
              {{ t('auth.login') }}
            </v-btn>
            <div class="d-flex justify-space-between mt-2">
              <v-btn variant="text" size="small" @click="mode = 'register'">
                {{ t('auth.createAccount') }}
              </v-btn>
              <v-btn variant="text" size="small" @click="mode = 'forgot'">
                {{ t('auth.forgotPassword') }}
              </v-btn>
            </div>
          </template>

          <!-- REGISTRO -->
          <template v-else-if="mode === 'register'">
            <v-text-field
              v-model="displayName"
              :label="t('auth.displayName')"
              :autocomplete="'name'"
              :rules="[v => (v?.trim().length ?? 0) >= 2 || t('auth.nameMin')]"
              :disabled="busy"
            />
            <v-text-field
              v-model="email"
              :label="t('auth.email')"
              type="email"
              :autocomplete="'email'"
              :rules="[v => !!v || t('auth.emailRequired'), v => v?.includes('@') || t('auth.emailInvalid')]"
              :disabled="busy"
            />
            <v-text-field
              v-model="password"
              :label="t('auth.password')"
              type="password"
              :autocomplete="'new-password'"
              :rules="[v => !!v || t('auth.passwordRequired'), v => (v?.length ?? 0) >= 6 || t('auth.passwordMin')]"
              :disabled="busy"
            />
            <v-btn
              :disabled="!isValid || busy"
              block
              color="primary"
              type="submit"
            >
              {{ t('auth.register') }}
            </v-btn>
            <div class="d-flex justify-space-between mt-2">
              <v-btn variant="text" size="small" @click="mode = 'login'">
                {{ t('auth.alreadyHaveAccount') }}
              </v-btn>
            </div>
          </template>

          <!-- ESQUECI MINHA SENHA -->
          <template v-else-if="mode === 'forgot'">
            <p class="text-caption mt-2" style="opacity: 0.75">
              {{ t('auth.forgotHint') }}
            </p>
            <v-text-field
              v-model="email"
              :label="t('auth.email')"
              type="email"
              :autocomplete="'email'"
              :rules="[v => !!v || t('auth.emailRequired'), v => v?.includes('@') || t('auth.emailInvalid')]"
              :disabled="busy"
            />
            <v-btn
              :disabled="!isValid || busy"
              block
              color="primary"
              type="submit"
            >
              {{ t('auth.sendResetToken') }}
            </v-btn>
            <div class="d-flex justify-space-between mt-2">
              <v-btn variant="text" size="small" @click="mode = 'login'">
                {{ t('auth.back') }}
              </v-btn>
            </div>
          </template>

          <!-- RESET (token + senha nova) -->
          <template v-else>
            <p class="text-caption mt-2" style="opacity: 0.75">
              {{ t('auth.resetHint') }}
            </p>
            <v-text-field
              v-model="resetToken"
              :label="t('auth.resetToken')"
              :autocomplete="'one-time-code'"
              :rules="[v => (v?.trim().length ?? 0) >= 16 || t('auth.tokenMin')]"
              :disabled="busy"
            />
            <v-text-field
              v-model="password"
              :label="t('auth.newPassword')"
              type="password"
              :autocomplete="'new-password'"
              :rules="[v => !!v || t('auth.passwordRequired'), v => (v?.length ?? 0) >= 8 || t('auth.newPasswordMin')]"
              :disabled="busy"
            />
            <v-btn
              :disabled="!isValid || busy"
              block
              color="primary"
              type="submit"
            >
              {{ t('auth.changePassword') }}
            </v-btn>
            <div class="d-flex justify-space-between mt-2">
              <v-btn variant="text" size="small" @click="mode = 'login'">
                {{ t('auth.back') }}
              </v-btn>
            </div>
          </template>
        </form>
      </template>
    </v-card>
  </v-dialog>
</template>