import type { CompanyProfile } from '../domain/models/CompanyProfile'
import { getDb, STORE_SETTINGS } from './db'

const COMPANY_PROFILE_KEY = 'company'

export async function saveCompanyProfile(profile: CompanyProfile): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SETTINGS, JSON.parse(JSON.stringify(profile)), COMPANY_PROFILE_KEY)
}

export async function loadCompanyProfile(): Promise<CompanyProfile | undefined> {
  const db = await getDb()
  return db.get(STORE_SETTINGS, COMPANY_PROFILE_KEY) as Promise<CompanyProfile | undefined>
}
