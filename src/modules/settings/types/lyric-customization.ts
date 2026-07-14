export type LyricVerticalAlign = 'top' | 'center' | 'bottom'

export type LyricFontWeight = '400' | '600' | '700' | '900'

/** Preferências de personalização da letra (slides de músicas). */
export type LyricCustomizationSettings = {
  lyricAlign: LyricVerticalAlign
  showSongTitle: boolean
  customTextFormat: boolean
  customBackground: boolean
  fontSizePercent: number
  fontColor: string
  fontWeight: LyricFontWeight
  backgroundColor: string
  backgroundImage: string | null
  backgroundOpacity: number
}

export const DEFAULT_LYRIC_CUSTOMIZATION: LyricCustomizationSettings = {
  lyricAlign: 'center',
  showSongTitle: true,
  customTextFormat: false,
  customBackground: false,
  fontSizePercent: 100,
  fontColor: '#FFFFFF',
  fontWeight: '700',
  backgroundColor: '#000000',
  backgroundImage: null,
  backgroundOpacity: 100,
}

/** Cores de fundo sugeridas (alinhado ao Electron / stitch). */
export const PROJECTION_BACKGROUND_PRESETS = [
  '#0061a4',
  '#121c2c',
  '#f8f9fa',
  '#343a40',
  '#f1f3f5',
  '#495057',
  '#c2185b',
  '#4a148c',
] as const

export const LYRIC_ALIGN_OPTIONS: LyricVerticalAlign[] = [
  'top',
  'center',
  'bottom',
]

export const LYRIC_WEIGHT_OPTIONS: LyricFontWeight[] = [
  '400',
  '600',
  '700',
  '900',
]
