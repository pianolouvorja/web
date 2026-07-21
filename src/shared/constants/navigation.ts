export const mainNavRoutes = [
  { key: 'home', labelKey: 'nav.home', icon: 'ti-home', to: '/' },
  { key: 'albums', labelKey: 'nav.albums', icon: 'ti-playlist', to: '/albums' },
  { key: 'bible', labelKey: 'nav.bible', icon: 'ti-book-2', to: '/bible' },
  { key: 'utilities', labelKey: 'nav.utilities', icon: 'ti-tool', to: '/utilities' },
  { key: 'settings', labelKey: 'nav.settings', icon: 'ti-settings', to: '/settings/appearance' },
] as const
