/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string

  /** Window Management API (multi-tela). */
  interface ScreenDetailed extends Screen {
    availLeft: number
    availTop: number
    left: number
    top: number
    isPrimary: boolean
    label: string
  }

  interface ScreenDetails {
    screens: ScreenDetailed[]
    currentScreen: ScreenDetailed
  }

  interface Window {
    getScreenDetails?: () => Promise<ScreenDetails>
  }
}

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: string
  readonly VITE_URL_FILES?: string
  readonly VITE_URL_DATABASE?: string
  readonly VITE_API_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

export {}
