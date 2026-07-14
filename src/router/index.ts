import { createRouter, createWebHistory } from 'vue-router'

import AppShell from '@layouts/AppShell.vue'
import { bibleRoutes } from '@modules/bible/routes'
import { utilitiesRoutes } from '@modules/clock/routes'
import { homeRoutes } from '@modules/home/routes'
import { liturgyRoutes } from '@modules/liturgy/routes'
import { settingsRoutes } from '@modules/settings/routes'
import PopupHost from '@shared/views/PopupHost.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/popup',
      name: 'popup',
      component: PopupHost,
      meta: {
        bare: true,
      },
    },
    {
      path: '/',
      component: AppShell,
      children: [
        ...homeRoutes,
        ...liturgyRoutes,
        ...bibleRoutes,
        ...utilitiesRoutes,
        ...settingsRoutes,
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
