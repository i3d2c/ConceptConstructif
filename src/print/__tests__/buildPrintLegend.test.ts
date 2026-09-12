import { describe, it, expect } from 'vitest'
import { buildPrintLegend } from '../buildPrintLegend'
import type { Project } from '../../domain/models/Project'
import type { Zone, ColorAssignment } from '../../domain/models/Zone'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { LineTrace } from '../../domain/models/Trace'

const ouvrageA: Ouvrage = { id: 'o-a', name: 'Mur brique', description: '', category: 'Test', constituents: [] }
const ouvrageB: Ouvrage = { id: 'o-b', name: 'Cloison placo', description: '', category: 'Test', constituents: [] }
const caA: ColorAssignment = { id: 'ca-a', color: '#2563eb', ouvrageId: ouvrageA.id, epaisseur: 0.2, hauteur: 2.5 }
const caB: ColorAssignment = { id: 'ca-b', color: '#16a34a', ouvrageId: ouvrageB.id, epaisseur: 0.1, hauteur: 2.5 }

function makeZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'z1', name: 'Zone 1', scale: null, backgroundImage: null, backgroundImageLayout: null,
    colorAssignments: [], traces: [], printConfig: {} as Zone['printConfig'],
    ...overrides,
  }
}

function makeProject(zone: Zone, ouvrages: Ouvrage[] = []): Project {
  return {
    id: 'p1', name: 'Projet', ouvrages, constituents: [],
    zones: [zone], activeZoneId: zone.id, createdAt: '', updatedAt: '',
  }
}

describe('buildPrintLegend', () => {
  it('Should return one row with the color and ouvrage name for a used color assignment', () => {
    const traceA: LineTrace = { id: 't1', number: 1, type: 'line', colorAssignmentId: caA.id, up: 0, points: [[0, 0], [1, 0]] }
    const zone = makeZone({ colorAssignments: [caA], traces: [traceA] })
    const project = makeProject(zone, [ouvrageA])

    const legend = buildPrintLegend(project, zone)

    expect(legend).toEqual([{ color: '#2563eb', ouvrageName: 'Mur brique' }])
  })

  it('Should return a single row for a color assignment used by several traces, not one per trace', () => {
    const traceA: LineTrace = { id: 't1', number: 1, type: 'line', colorAssignmentId: caA.id, up: 0, points: [[0, 0], [1, 0]] }
    const traceB: LineTrace = { id: 't2', number: 2, type: 'line', colorAssignmentId: caA.id, up: 0, points: [[0, 0], [1, 0]] }
    const zone = makeZone({ colorAssignments: [caA], traces: [traceA, traceB] })
    const project = makeProject(zone, [ouvrageA])

    expect(buildPrintLegend(project, zone)).toHaveLength(1)
  })

  it('Should order rows by the first trace number using each color', () => {
    const traceB: LineTrace = { id: 't2', number: 2, type: 'line', colorAssignmentId: caB.id, up: 0, points: [[0, 0], [1, 0]] }
    const traceA: LineTrace = { id: 't1', number: 1, type: 'line', colorAssignmentId: caA.id, up: 0, points: [[0, 0], [1, 0]] }
    const zone = makeZone({ colorAssignments: [caA, caB], traces: [traceB, traceA] })
    const project = makeProject(zone, [ouvrageA, ouvrageB])

    const legend = buildPrintLegend(project, zone)

    expect(legend.map(l => l.ouvrageName)).toEqual(['Mur brique', 'Cloison placo'])
  })

  it('Should skip a trace whose color assignment no longer exists', () => {
    const orphanTrace: LineTrace = { id: 't1', number: 1, type: 'line', colorAssignmentId: 'missing', up: 0, points: [[0, 0], [1, 0]] }
    const zone = makeZone({ colorAssignments: [], traces: [orphanTrace] })
    const project = makeProject(zone)

    expect(buildPrintLegend(project, zone)).toEqual([])
  })

  it('Should return an empty array when the zone has no traces', () => {
    const zone = makeZone()
    const project = makeProject(zone)

    expect(buildPrintLegend(project, zone)).toEqual([])
  })
})
