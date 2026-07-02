import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'cc_theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('dark')

  function applyTheme() {
    document.documentElement.classList.toggle('light', theme.value === 'light')
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      theme.value = saved
    } else {
      theme.value = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    applyTheme()
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme()
    localStorage.setItem(STORAGE_KEY, theme.value)
  }

  return { theme, init, toggle }
})
