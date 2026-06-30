import { openDB, type IDBPDatabase } from 'idb'
import type { Project } from '../domain/models/Project'

const DB_NAME = 'conceptconstructif'
const DB_VERSION = 1
const STORE = 'projects'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb()
  await db.put(STORE, { ...project, updatedAt: new Date().toISOString() })
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDb()
  return db.get(STORE, id) as Promise<Project | undefined>
}

export async function listProjects(): Promise<Pick<Project, 'id' | 'name' | 'updatedAt'>[]> {
  const db = await getDb()
  const all = await db.getAll(STORE) as Project[]
  return all.map(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
}
