export interface CompanyProfile {
  companyName: string
  contactName: string
  phone: string
  email: string
  logo: string | null
  logoAspectRatio: number | null
}

export function emptyCompanyProfile(): CompanyProfile {
  return {
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    logo: null,
    logoAspectRatio: null,
  }
}
