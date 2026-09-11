import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settingsStore'
import { saveCompanyProfile } from '../../storage/SettingsStore'
import { emptyCompanyProfile } from '../../domain/models/CompanyProfile'

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('init', () => {
    it('Should expose an empty company profile when nothing was saved yet', async () => {
      const store = useSettingsStore()
      await store.init()
      expect(store.companyProfile).toEqual(emptyCompanyProfile())
    })

    it('Should load the previously saved company profile', async () => {
      await saveCompanyProfile({ ...emptyCompanyProfile(), companyName: 'Concept Constructif' })

      const store = useSettingsStore()
      await store.init()

      expect(store.companyProfile.companyName).toBe('Concept Constructif')
    })
  })

  describe('save', () => {
    it('Should persist the current company profile', async () => {
      const store = useSettingsStore()
      await store.init()
      store.companyProfile.companyName = 'Ma Société'

      await store.save()

      setActivePinia(createPinia())
      const reloaded = useSettingsStore()
      await reloaded.init()

      expect(reloaded.companyProfile.companyName).toBe('Ma Société')
    })
  })
})
