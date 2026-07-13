/** Chaves de persistência no browser (localStorage / sessionStorage). */
export const BROWSER_STORAGE_KEYS = {
  userPreferences: 'user_data',
  popupLayout: 'louvorja_popup_layout',
  recentCollections: 'history_recent_collections',
  topSongs: 'history_top_songs',
  catalogSessionPrefix: 'db:',
} as const

/** Campos dentro de `user_data` (preferências do operador). */
export const USER_PREFERENCE_KEYS = {
  theme: 'theme',
  blur: 'blur',
  language: 'language',
  popupCount: 'popup_count',
  mediaUseInternalPlayer: 'media_use_internal_player',
  mediaAutoProjectVideo: 'media_auto_project_video',
  mediaPauseOnMinimize: 'media_pause_on_minimize',
  mediaLazyLoad: 'media_lazy_load',
  mediaFadeAudio: 'media_fade_audio',
  bibleSelectedVersion: 'bible.selectedVersionId',
} as const
