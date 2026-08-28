import { openDB, type IDBPDatabase } from 'idb'

export const DB_NAME = 'conceptconstructif'
export const DB_VERSION = 2
export const STORE_PROJECTS = 'projects'
export const STORE_OUVRAGE_LIBRARY = 'ouvrageLibrary'
export const STORE_CONSTITUENT_LIBRARY = 'constituentLibrary'

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
        }
        if (oldVersion < 2) {
          db.createObjectStore(STORE_OUVRAGE_LIBRARY, { keyPath: 'id' })
          db.createObjectStore(STORE_CONSTITUENT_LIBRARY, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}
