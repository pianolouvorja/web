import type { RouteRecordRaw } from 'vue-router'

import AlbumsView from './views/AlbumsView.vue'
import AlbumCollectionView from './views/AlbumCollectionView.vue'

export const albumsRoutes: RouteRecordRaw[] = [
  {
    path: 'albums',
    name: 'albums',
    component: AlbumsView,
    meta: {
      navKey: 'albums',
      desktopOnly: true,
    },
  },
  {
    path: 'albums/:collectionId',
    name: 'albums-collection',
    component: AlbumCollectionView,
    meta: {
      navKey: 'albums',
      desktopOnly: true,
    },
  },
]
