import type { Ouvrage } from '../domain/models/Ouvrage'
import type { Constituent } from '../domain/models/Constituent'
import { getDb, STORE_OUVRAGE_LIBRARY, STORE_CONSTITUENT_LIBRARY } from './db'

export async function saveLibraryOuvrage(ouvrage: Ouvrage): Promise<void> {
  const db = await getDb()
  await db.put(STORE_OUVRAGE_LIBRARY, JSON.parse(JSON.stringify(ouvrage)))
}

export async function loadLibraryOuvrage(id: string): Promise<Ouvrage | undefined> {
  const db = await getDb()
  return db.get(STORE_OUVRAGE_LIBRARY, id) as Promise<Ouvrage | undefined>
}

export async function listLibraryOuvrages(): Promise<Ouvrage[]> {
  const db = await getDb()
  return db.getAll(STORE_OUVRAGE_LIBRARY) as Promise<Ouvrage[]>
}

export async function deleteLibraryOuvrage(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_OUVRAGE_LIBRARY, id)
}

export async function saveLibraryConstituent(constituent: Constituent): Promise<void> {
  const db = await getDb()
  await db.put(STORE_CONSTITUENT_LIBRARY, JSON.parse(JSON.stringify(constituent)))
}

export async function loadLibraryConstituent(id: string): Promise<Constituent | undefined> {
  const db = await getDb()
  return db.get(STORE_CONSTITUENT_LIBRARY, id) as Promise<Constituent | undefined>
}

export async function listLibraryConstituents(): Promise<Constituent[]> {
  const db = await getDb()
  return db.getAll(STORE_CONSTITUENT_LIBRARY) as Promise<Constituent[]>
}

export async function deleteLibraryConstituent(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_CONSTITUENT_LIBRARY, id)
}
