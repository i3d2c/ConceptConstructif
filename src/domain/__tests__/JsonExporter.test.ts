import { describe, it, expect } from 'vitest'
import { exportProject, importProject } from '../../storage/JsonExporter'
import type { Project } from '../models/Project'

const project: Project = {
  id: 'p-1',
  name: 'Test',
  ouvrages: [],
  constituents: [],
  zones: [],
  activeZoneId: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('JsonExporter', () => {
  it('exporte le projet en JSON string', () => {
    const json = exportProject(project)
    expect(typeof json).toBe('string')
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('Test')
  })

  it('importProject restitue un Project valide depuis le JSON exporté', () => {
    const json = exportProject(project)
    const restored = importProject(json)
    expect(restored.id).toBe('p-1')
    expect(restored.name).toBe('Test')
    expect(Array.isArray(restored.zones)).toBe(true)
  })

  it('importProject lève une erreur sur un JSON invalide', () => {
    expect(() => importProject('{"foo":"bar"}')).toThrow()
  })
})
