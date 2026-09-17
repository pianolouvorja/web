import { ref, computed, type ComputedRef } from 'vue'
import {
  getAuthSession,
  login,
  logout,
  register,
  resetPassword,
  requestPasswordReset,
  type AuthSession,
} from '../services/auth-client'

/** Estado reativo da sessão de autenticação. */
export const authSession = ref<AuthSession | null>(getAuthSession())

/** Notificador global (snackbar) — setado pelo AppShell ao montar. */
let notifyFn: ((message: string, isError?: boolean) => void) | null = null

export function setNotify(fn: (message: string, isError?: boolean) => void): void {
  notifyFn = fn
}

function notify(message: string, isError?: boolean): void {
  notifyFn?.(message, isError)
}

interface UseAuthReturn {
  session: typeof authSession
  isLoggedIn: ComputedRef<boolean>
  userName: ComputedRef<string>
  userEmail: ComputedRef<string>
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, displayName: string) => Promise<boolean>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
}

export function useAuth(): UseAuthReturn {
  const session = authSession
  const isLoggedIn = computed(() => !!session.value)
  const userName = computed(() => session.value?.user.displayName ?? '')
  const userEmail = computed(() => session.value?.user.email ?? '')

  async function doLogin(email: string, password: string): Promise<boolean> {
    const result = await login(email.trim(), password)
    if (result) {
      session.value = result
      notify(`Bem-vindo, ${result.user.displayName}!`)
      return true
    }
    notify('E-mail ou senha incorretos', true)
    return false
  }

  async function doRegister(email: string, password: string, displayName: string): Promise<boolean> {
    const result = await register(email.trim(), password, displayName.trim())
    if (result) {
      session.value = result
      notify(`Bem-vindo, ${result.user.displayName}!`)
      return true
    }
    notify('Não foi possível criar a conta (e-mail já existe?)', true)
    return false
  }

  async function doLogout(): Promise<void> {
    await logout()
    session.value = null
    notify('Sessão encerrada')
  }

  async function doForgotPassword(email: string): Promise<boolean> {
    const token = await requestPasswordReset(email.trim())
    if (token) {
      notify('Token gerado — confirme a senha nova')
      return true
    }
    // Resposta neutra da API: não revela se o e-mail existe.
    notify('Se o e-mail existir, o suporte tem o token de reset')
    return false
  }

  async function doResetPassword(token: string, password: string): Promise<boolean> {
    const ok = await resetPassword(token.trim(), password)
    if (ok) {
      notify('Senha alterada! Entre com a senha nova')
      return true
    }
    notify('Token inválido ou expirado', true)
    return false
  }

  return {
    session,
    isLoggedIn,
    userName,
    userEmail,
    login: doLogin,
    register: doRegister,
    logout: doLogout,
    forgotPassword: doForgotPassword,
    resetPassword: doResetPassword,
  }
}