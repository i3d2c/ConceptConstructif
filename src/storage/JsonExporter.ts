import type { Project } from '../domain/models/Project'

export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function importProject(json: string): Project {
  const data = JSON.parse(json) as Project
  if (!data.id || !data.name || !Array.isArray(data.zones)) {
    throw new Error('JSON invalide : structure Project manquante')
  }
  return data
}

export function downloadProject(project: Project): void {
  const json = exportProject(project)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/\s+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
