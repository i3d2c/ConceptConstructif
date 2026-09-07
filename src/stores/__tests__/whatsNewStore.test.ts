import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWhatsNewStore, CURRENT_ANNOUNCEMENT_ID, STORAGE_KEY } from '../whatsNewStore'

describe('whatsNewStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('init', () => {
    it('Should set shouldShow to true when nothing is stored yet', () => {
      const store = useWhatsNewStore()
      store.init()
      expect(store.shouldShow).toBe(true)
    })

    it('Should set shouldShow to false when the current announcement id is already stored', () => {
      localStorage.setItem(STORAGE_KEY, CURRENT_ANNOUNCEMENT_ID)
      const store = useWhatsNewStore()
      store.init()
      expect(store.shouldShow).toBe(false)
    })

    it('Should set shouldShow to true when a different (older) announcement id is stored', () => {
      localStorage.setItem(STORAGE_KEY, 'whats-new-2025-01')
      const store = useWhatsNewStore()
      store.init()
      expect(store.shouldShow).toBe(true)
    })
  })

  describe('markSeen', () => {
    it('Should persist the current id and hide the popup', () => {
      const store = useWhatsNewStore()
      store.init()
      store.markSeen()
      expect(store.shouldShow).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBe(CURRENT_ANNOUNCEMENT_ID)
    })
  })
})
