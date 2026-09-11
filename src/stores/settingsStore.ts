import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { emptyCompanyProfile } from '../domain/models/CompanyProfile'
import { loadCompanyProfile, saveCompanyProfile } from '../storage/SettingsStore'

export const useSettingsStore = defineStore('settings', () => {
  const companyProfile = reactive(emptyCompanyProfile())

  async function init() {
    const loaded = await loadCompanyProfile()
    Object.assign(companyProfile, loaded ?? emptyCompanyProfile())
  }

  async function save() {
    await saveCompanyProfile({ ...companyProfile })
  }

  return { companyProfile, init, save }
})
