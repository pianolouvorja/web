import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import '@styles/tailwind.css'
import { useThemeManager } from '@design-system/composables'
import i18n from '@plugins/i18n'
import vuetify from '@plugins/vuetify'
import { APP_PRODUCT_NAME } from '@shared/constants/app'
import { installPopupOpenerBridge } from '@shared/services/popup-windows'
import router from '@/router'

document.title = APP_PRODUCT_NAME

useThemeManager()
installPopupOpenerBridge()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(i18n)

app.mount('#app')
