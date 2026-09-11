import type { Project } from '../domain/models/Project'
import type { Zone } from '../domain/models/Zone'

export interface PrintLegendRow {
  color: string
  ouvrageName: string
}

export function buildPrintLegend(project: Project, zone: Zone): PrintLegendRow[] {
  const firstTraceNumberByColorAssignment = new Map<string, number>()
  for (const trace of zone.traces) {
    const current = firstTraceNumberByColorAssignment.get(trace.colorAssignmentId)
    if (current === undefined || trace.number < current) {
      firstTraceNumberByColorAssignment.set(trace.colorAssignmentId, trace.number)
    }
  }

  return [...firstTraceNumberByColorAssignment.entries()]
    .map(([colorAssignmentId, firstTraceNumber]) => {
      const ca = zone.colorAssignments.find(c => c.id === colorAssignmentId)
      const ouvrage = project.ouvrages.find(o => o.id === ca?.ouvrageId)
      if (!ca || !ouvrage) return null
      return { color: ca.color, ouvrageName: ouvrage.name, firstTraceNumber }
    })
    .filter((row): row is { color: string; ouvrageName: string; firstTraceNumber: number } => row !== null)
    .sort((a, b) => a.firstTraceNumber - b.firstTraceNumber)
    .map(({ color, ouvrageName }) => ({ color, ouvrageName }))
}
