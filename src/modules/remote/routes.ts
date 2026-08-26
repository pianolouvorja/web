import type { RouteRecordRaw } from 'vue-router'

import RemoteControlView from './views/RemoteControlView.vue'

export const remoteRoutes: RouteRecordRaw[] = [
  {
    path: 'remote',
    name: 'settings-remote',
    component: RemoteControlView,
    meta: {
      navKey: 'settings',
      desktopOnly: false,
    },
  },
]
