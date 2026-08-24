import type { RouteRecordRaw } from 'vue-router'

import AppearanceView from './views/AppearanceView.vue'
import ProjectionView from './views/ProjectionView.vue'
import SettingsView from './views/SettingsView.vue'
import { remoteRoutes } from '@modules/remote/routes'

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
      {
        path: 'general',
        name: 'settings-general',
        component: () => import('./views/GeneralView.vue'),
        meta: {
          navKey: 'settings',
          desktopOnly: false,
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
      ...remoteRoutes,
    ],
  },
]
