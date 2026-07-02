import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { useThemeStore } from './stores/themeStore'

const app = createApp(App)
app.use(createPinia())
useThemeStore().init()
app.mount('#app')
