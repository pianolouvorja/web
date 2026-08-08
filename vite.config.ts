/// <reference types="vitest/config" />
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_URL ?? '/'

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      allowedHosts: true,
    },
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{html,js,css,svg,png,woff,woff2,ttf}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'piano-fonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        manifest: {
          name: 'LouvorJA - PIANO',
          short_name: 'LouvorJA',
          description: 'LouvorJA - PIANO — versão web para gerenciamento de culto',
          start_url: base,
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            {
              src: `${base}ico/favicon-16x16.png`,
              sizes: '16x16',
              type: 'image/png',
            },
            {
              src: `${base}ico/favicon-32x32.png`,
              sizes: '32x32',
              type: 'image/png',
            },
            {
              src: `${base}ico/favicon-144x144.png`,
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: `${base}ico/favicon-152x152.png`,
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: `${base}ico/favicon-180x180.png`,
              sizes: '180x180',
              type: 'image/png',
            },
            {
              src: `${base}ico/favicon-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: `${base}ico/favicon-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@app': path.resolve(__dirname, './src/app'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@design-system': path.resolve(__dirname, './src/design-system'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@plugins': path.resolve(__dirname, './src/plugins'),
        '@themes': path.resolve(__dirname, './src/design-system/themes'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@locales': fileURLToPath(new URL('./src/locales', import.meta.url)),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/__tests__/**/*.test.ts'],
    },
  }
})
