import type { RouteRecordRaw } from 'vue-router'

import AppearanceView from './views/AppearanceView.vue'
import ProjectionView from './views/ProjectionView.vue'
import SettingsView from './views/SettingsView.vue'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings',
    component: SettingsView,
    meta: {
      navKey: 'settings',
      desktopOnly: false,
    },
    redirect: { name: 'settings-appearance' },
    children: [
      {
        path: 'appearance',
        name: 'settings-appearance',
        component: AppearanceView,
        meta: {
          navKey: 'settings',
          desktopOnly: false,
        },
      },
      // Geral / Mídia — ocultos no menu; redirect até reativarmos as seções.
      {
        path: 'general',
        name: 'settings-general',
        redirect: { name: 'settings-appearance' },
        meta: {
          desktopOnly: true,
        },
      },
      {
        path: 'media',
        name: 'settings-media',
        redirect: { name: 'settings-appearance' },
        meta: {
          desktopOnly: true,
        },
      },
      {
        path: 'projection',
        name: 'settings-projection',
        component: ProjectionView,
        meta: {
          navKey: 'settings',
          desktopOnly: true,
        },
      },
    ],
  },
]
