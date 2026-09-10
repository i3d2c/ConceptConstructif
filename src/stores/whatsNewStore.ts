import { defineStore } from 'pinia'
import { ref } from 'vue'

export const CURRENT_ANNOUNCEMENT_ID = 'whats-new-2026-09-10'
export const STORAGE_KEY = 'cc_whatsnew_seen'

export const useWhatsNewStore = defineStore('whatsNew', () => {
  const shouldShow = ref(false)

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    shouldShow.value = saved !== CURRENT_ANNOUNCEMENT_ID
  }

  function markSeen() {
    shouldShow.value = false
    localStorage.setItem(STORAGE_KEY, CURRENT_ANNOUNCEMENT_ID)
  }

  return { shouldShow, init, markSeen }
})
