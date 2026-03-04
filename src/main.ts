import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.ts'
import './styles/theme.css'
import './style.css' // ✅ 加這行：載入你正在改的 src/style.css
import App from './App.vue'

function setupMobileAntiZoom() {
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  if (!isTouchDevice) return

  let lastTouchEnd = 0
  const interactiveSelector =
    'input, textarea, select, button, a, label, [contenteditable="true"]'

  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      const isDoubleTap = now - lastTouchEnd <= 300
      lastTouchEnd = now
      if (!isDoubleTap) return

      const target = e.target as HTMLElement | null
      if (target?.closest(interactiveSelector)) return
      e.preventDefault()
    },
    { passive: false }
  )

  const blockGesture = (e: Event) => e.preventDefault()
  document.addEventListener('gesturestart', blockGesture as EventListener, { passive: false })
  document.addEventListener('gesturechange', blockGesture as EventListener, { passive: false })
}

setupMobileAntiZoom()

createApp(App).use(createPinia()).use(router).mount('#app')
