import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { getDb, STORE_PROJECTS, STORE_OUVRAGE_LIBRARY, STORE_CONSTITUENT_LIBRARY, STORE_SETTINGS } from '../db'

describe('db', () => {
  it('Should create the projects, ouvrageLibrary, constituentLibrary and settings object stores', async () => {
    const db = await getDb()

    const storeNames = Array.from(db.objectStoreNames).sort()

    expect(storeNames).toEqual(
      [STORE_CONSTITUENT_LIBRARY, STORE_OUVRAGE_LIBRARY, STORE_PROJECTS, STORE_SETTINGS].sort(),
    )
  })
})
