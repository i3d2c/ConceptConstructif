import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { saveCompanyProfile, loadCompanyProfile } from '../SettingsStore'
import type { CompanyProfile } from '../../domain/models/CompanyProfile'

const profile: CompanyProfile = {
  companyName: 'Concept Constructif',
  contactName: 'Guillaume Dubus',
  phone: '0600000000',
  email: 'contact@example.com',
  logo: 'data:image/png;base64,abc',
  logoAspectRatio: 2.5,
}

describe('SettingsStore', () => {
  it('Should return undefined when no company profile has been saved yet', async () => {
    const loaded = await loadCompanyProfile()
    expect(loaded).toBeUndefined()
  })

  it('Should save and reload the company profile unchanged', async () => {
    await saveCompanyProfile(profile)

    const loaded = await loadCompanyProfile()

    expect(loaded).toEqual(profile)
  })
})
