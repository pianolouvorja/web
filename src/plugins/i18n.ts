import { createI18n } from 'vue-i18n'

import en from '@locales/en'
import es from '@locales/es'
import ptBR from '@locales/pt-BR'
import albumsEn from '@modules/albums/locales/en'
import albumsEs from '@modules/albums/locales/es'
import albumsPtBR from '@modules/albums/locales/pt-BR'
import bibleEn from '@modules/bible/locales/en'
import bibleEs from '@modules/bible/locales/es'
import biblePtBR from '@modules/bible/locales/pt-BR'
import clockEn from '@modules/clock/locales/en'
import clockEs from '@modules/clock/locales/es'
import clockPtBR from '@modules/clock/locales/pt-BR'
import countdownEn from '@modules/countdown/locales/en'
import countdownEs from '@modules/countdown/locales/es'
import countdownPtBR from '@modules/countdown/locales/pt-BR'
import homeEn from '@modules/home/locales/en'
import homeEs from '@modules/home/locales/es'
import homePtBR from '@modules/home/locales/pt-BR'
import liturgyEn from '@modules/liturgy/locales/en'
import liturgyEs from '@modules/liturgy/locales/es'
import liturgyPtBR from '@modules/liturgy/locales/pt-BR'
import mediaEn from '@modules/media/locales/en'
import mediaEs from '@modules/media/locales/es'
import mediaPtBR from '@modules/media/locales/pt-BR'
import randomEn from '@modules/random/locales/en'
import randomEs from '@modules/random/locales/es'
import randomPtBR from '@modules/random/locales/pt-BR'
import settingsEn from '@modules/settings/locales/en'
import settingsEs from '@modules/settings/locales/es'
import settingsPtBR from '@modules/settings/locales/pt-BR'
import timerEn from '@modules/timer/locales/en'
import timerEs from '@modules/timer/locales/es'
import timerPtBR from '@modules/timer/locales/pt-BR'

const modulesPtBR = {
  ...albumsPtBR, ...biblePtBR, ...clockPtBR, ...countdownPtBR, ...homePtBR,
  ...liturgyPtBR, ...mediaPtBR, ...randomPtBR, ...settingsPtBR, ...timerPtBR,
}
const modulesEn = {
  ...albumsEn, ...bibleEn, ...clockEn, ...countdownEn, ...homeEn,
  ...liturgyEn, ...mediaEn, ...randomEn, ...settingsEn, ...timerEn,
}
const modulesEs = {
  ...albumsEs, ...bibleEs, ...clockEs, ...countdownEs, ...homeEs,
  ...liturgyEs, ...mediaEs, ...randomEs, ...settingsEs, ...timerEs,
}

const savedLocale = localStorage.getItem('language') ?? 'pt-BR'

export default createI18n({
  legacy: false,
  locale: ['pt-BR', 'en', 'es'].includes(savedLocale) ? savedLocale : 'pt-BR',
  fallbackLocale: 'pt-BR',
  messages: {
    'pt-BR': { ...ptBR, ...modulesPtBR },
    en: { ...en, ...modulesEn },
    es: { ...es, ...modulesEs },
  },
})
