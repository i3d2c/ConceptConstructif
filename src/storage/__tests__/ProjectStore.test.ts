import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { saveProject, loadProject, listProjects, deleteProject } from '../ProjectStore'
import type { Project } from '../../domain/models/Project'

function makeProject(id: string, name: string): Project {
  const zoneId = `${id}-zone-1`
  return {
    id,
    name,
    ouvrages: [],
    constituents: [],
    zones: [{ id: zoneId, name: 'Zone 1', scale: null, backgroundImage: null, colorAssignments: [], traces: [] }],
    activeZoneId: zoneId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('ProjectStore', () => {
  it('Should save and reload a project unchanged', async () => {
    const project = makeProject('p-1', 'Projet A')
    await saveProject(project)

    const loaded = await loadProject('p-1')

    expect(loaded?.id).toBe('p-1')
    expect(loaded?.name).toBe('Projet A')
  })

  it('Should list saved projects and delete one by id', async () => {
    await saveProject(makeProject('p-2', 'Projet B'))
    await saveProject(makeProject('p-3', 'Projet C'))

    const before = await listProjects()
    expect(before.map(p => p.id)).toEqual(expect.arrayContaining(['p-2', 'p-3']))

    await deleteProject('p-2')
    const after = await listProjects()
    expect(after.map(p => p.id)).not.toContain('p-2')
  })
})
