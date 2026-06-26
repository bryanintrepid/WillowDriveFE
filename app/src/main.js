
import './assets/scss/config/default/app.scss';
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'bootstrap'
import '@/assets/scss/main.scss'
import { startTokenRefresh } from '@/services/tokenRefresh'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// If a valid session is already in localStorage (e.g. after a page reload or the
// kiosk browser relaunching), arm the proactive access-token refresh timer.
startTokenRefresh()
