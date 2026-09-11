import { describe, it, expect } from 'vitest'
import { emptyCompanyProfile } from '../CompanyProfile'

describe('emptyCompanyProfile', () => {
  it('Should return a profile with all fields blank and no logo', () => {
    expect(emptyCompanyProfile()).toEqual({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      logo: null,
    })
  })
})
