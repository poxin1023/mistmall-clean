import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.ts'
import './styles/theme.css'
import './style.css' // ✅ 加這行：載入你正在改的 src/style.css
import App from './App.vue'

createApp(App).use(createPinia()).use(router).mount('#app')
