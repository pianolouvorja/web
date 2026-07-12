/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string
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
