import type { Project } from '../domain/models/Project'
import { getDb, STORE_PROJECTS } from './db'

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb()
  // JSON round-trip strips Vue reactive proxies before structured clone
  const plain = JSON.parse(JSON.stringify(project))
  plain.updatedAt = new Date().toISOString()
  await db.put(STORE_PROJECTS, plain)
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDb()
  return db.get(STORE_PROJECTS, id) as Promise<Project | undefined>
}

export async function listProjects(): Promise<Pick<Project, 'id' | 'name' | 'updatedAt'>[]> {
  const db = await getDb()
  const all = await db.getAll(STORE_PROJECTS) as Project[]
  return all.map(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_PROJECTS, id)
}
