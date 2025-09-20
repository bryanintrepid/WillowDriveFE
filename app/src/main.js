
import './assets/scss/config/default/app.scss';
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'bootstrap'
import '@/assets/scss/main.scss' 

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
