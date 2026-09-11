import { describe, it, expect } from 'vitest'
import { buildPrintData } from '../buildPrintData'
import { defaultPrintConfig } from '../PrintConfig'
import type { Project } from '../../domain/models/Project'
import type { Zone, ColorAssignment } from '../../domain/models/Zone'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import type { LineTrace } from '../../domain/models/Trace'

const usedConstituent: Constituent = {
  id: 'c-used', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie', formulaRecap: 'ceil(X)',
}
const unusedConstituent: Constituent = {
  id: 'c-unused', name: 'Peinture', unit: 'litre', unitPrice: 12, category: 'Finition',
}

const usedOuvrage: Ouvrage = {
  id: 'o-used', name: 'Mur brique', description: 'Mur en brique pleine porteuse', category: 'Maçonnerie',
  constituents: [{ id: 'oc-used', constituentId: usedConstituent.id, position: 1, formula: 'L/3' }],
}
const unusedOuvrage: Ouvrage = {
  id: 'o-unused', name: 'Peinture murale', description: 'Peinture murale deux couches', category: 'Finition',
  constituents: [{ id: 'oc-unused', constituentId: unusedConstituent.id, position: 1, formula: 'L' }],
}

const colorAssignment: ColorAssignment = {
  id: 'ca-1', color: '#ff0000', ouvrageId: usedOuvrage.id, epaisseur: 0.2, hauteur: 2.5,
}

const drawnTrace: LineTrace = {
  id: 't-1', number: 1, type: 'line', colorAssignmentId: colorAssignment.id, up: 0,
  points: [[0, 0], [100, 0]],
}

function makeZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'zone-1', name: 'Zone 1', backgroundImage: null, backgroundImageLayout: null,
    scale: { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] },
    colorAssignments: [], traces: [], printConfig: defaultPrintConfig(),
    ...overrides,
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1', name: 'Projet', ouvrages: [], constituents: [],
    zones: [makeZone()], activeZoneId: 'zone-1',
    createdAt: '', updatedAt: '',
    ...overrides,
  }
}

function fmt(n: number) {
  return Number(n.toFixed(2))
}

describe('buildPrintData', () => {
  describe('when the zone has no scale', () => {
    it('Should return empty sections and a zero grand total', () => {
      const project = makeProject({ zones: [makeZone({ scale: null })] })

      const data = buildPrintData(project, project.zones[0])

      expect(data.traces).toEqual([])
      expect(data.recapOuvrages).toEqual([])
      expect(data.devisLines).toEqual([])
      expect(data.recapConstituents).toEqual([])
      expect(data.grandTotal).toBe(0)
    })
  })

  describe('recap ouvrage', () => {
    function projectWithUsedAndUnusedOuvrages() {
      return makeProject({
        ouvrages: [usedOuvrage, unusedOuvrage],
        constituents: [usedConstituent, unusedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })
    }

    it('Should not list an ouvrage that has no trace in the zone', () => {
      const project = projectWithUsedAndUnusedOuvrages()

      const data = buildPrintData(project, project.zones[0])

      expect(data.recapOuvrages.map(o => o.ouvrageId)).not.toContain(unusedOuvrage.id)
    })

    it('Should list an ouvrage that has a trace in the zone, with its constituent lines', () => {
      const project = projectWithUsedAndUnusedOuvrages()

      const data = buildPrintData(project, project.zones[0])

      const recap = data.recapOuvrages.find(o => o.ouvrageId === usedOuvrage.id)
      expect(recap).toBeTruthy()
      expect(recap!.constituents).toHaveLength(1)
      expect(recap!.constituents[0].name).toBe(usedConstituent.name)
    })

    it('Should not include a constituent line hidden with hideFromRecapOuvrage', () => {
      const hiddenOuvrage: Ouvrage = {
        id: 'o-hidden', name: 'Ouvrage caché', description: '', category: 'Test',
        constituents: [{ id: 'oc-hidden', constituentId: usedConstituent.id, position: 1, formula: 'L', hideFromRecapOuvrage: true }],
      }
      const ca: ColorAssignment = { id: 'ca-hidden', color: '#000', ouvrageId: hiddenOuvrage.id, epaisseur: 0.2, hauteur: 2.5 }
      const trace: LineTrace = { id: 't-hidden', number: 1, type: 'line', colorAssignmentId: ca.id, up: 0, points: [[0, 0], [100, 0]] }
      const project = makeProject({
        ouvrages: [hiddenOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [ca], traces: [trace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.recapOuvrages.find(o => o.ouvrageId === hiddenOuvrage.id)!.constituents).toHaveLength(0)
    })
  })

  describe('devis', () => {
    it('Should not list an ouvrage that has no trace in the zone', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage, unusedOuvrage],
        constituents: [usedConstituent, unusedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.devisLines.map(l => l.ouvrageId)).not.toContain(unusedOuvrage.id)
    })

    it('Should carry the ouvrage description for its devis line', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.devisLines[0].description).toBe(usedOuvrage.description)
    })

    it('Should use the recap-constituent total (with formulaRecap rounding applied) as the devis total', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      const roundedQty = Math.ceil(5 / 3)
      expect(fmt(data.devisTotal)).toBe(fmt(roundedQty * usedConstituent.unitPrice))
    })

    it('Should scale each shared-constituent ouvrage price proportionally so their sum equals the rounded total', () => {
      const sharedConstituent: Constituent = {
        id: 'c-shared', name: 'Constituant partagé', unit: 'unité', unitPrice: 1, category: 'Test', formulaRecap: 'ceil(X)',
      }
      const ouvrageA: Ouvrage = {
        id: 'o-a', name: 'Ouvrage A', description: '', category: 'Test',
        constituents: [{ id: 'oc-a', constituentId: sharedConstituent.id, position: 1, formula: 'L/5' }],
      }
      const ouvrageB: Ouvrage = {
        id: 'o-b', name: 'Ouvrage B', description: '', category: 'Test',
        constituents: [{ id: 'oc-b', constituentId: sharedConstituent.id, position: 1, formula: 'L/2' }],
      }
      const caA: ColorAssignment = { id: 'ca-a', color: '#111111', ouvrageId: ouvrageA.id, epaisseur: 0.2, hauteur: 2.5 }
      const caB: ColorAssignment = { id: 'ca-b', color: '#222222', ouvrageId: ouvrageB.id, epaisseur: 0.2, hauteur: 2.5 }
      const traceA: LineTrace = { id: 't-a', number: 1, type: 'line', colorAssignmentId: caA.id, up: 0, points: [[0, 0], [100, 0]] }
      const traceB: LineTrace = { id: 't-b', number: 2, type: 'line', colorAssignmentId: caB.id, up: 0, points: [[0, 0], [100, 0]] }
      const project = makeProject({
        ouvrages: [ouvrageA, ouvrageB],
        constituents: [sharedConstituent],
        zones: [makeZone({ colorAssignments: [caA, caB], traces: [traceA, traceB] })],
      })

      const data = buildPrintData(project, project.zones[0])

      const rawA = 5 / 5
      const rawB = 5 / 2
      const roundedTotalQty = Math.ceil(rawA + rawB)
      const ratio = roundedTotalQty / (rawA + rawB)

      expect(fmt(data.devisLines.find(l => l.ouvrageId === ouvrageA.id)!.price)).toBe(fmt(rawA * ratio))
      expect(fmt(data.devisLines.find(l => l.ouvrageId === ouvrageB.id)!.price)).toBe(fmt(rawB * ratio))
      expect(fmt(data.devisTotal)).toBe(fmt(roundedTotalQty))
    })
  })

  describe('recap constituent', () => {
    it('Should not list a constituent from an ouvrage that has no trace in the zone', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage, unusedOuvrage],
        constituents: [usedConstituent, unusedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.recapConstituents.map(c => c.constituentId)).not.toContain(unusedConstituent.id)
    })

    it('Should default the supplier to null when the constituent has none', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.recapConstituents[0].supplier).toBeNull()
    })

    it('Should flag a constituent as having an error when one of its formulas fails to evaluate', () => {
      const brokenOuvrage: Ouvrage = {
        id: 'o-broken', name: 'Ouvrage cassé', description: '', category: 'Test',
        constituents: [{ id: 'oc-broken', constituentId: usedConstituent.id, position: 1, formula: 'not_a_variable' }],
      }
      const ca: ColorAssignment = { id: 'ca-broken', color: '#000', ouvrageId: brokenOuvrage.id, epaisseur: 0.2, hauteur: 2.5 }
      const trace: LineTrace = { id: 't-broken', number: 1, type: 'line', colorAssignmentId: ca.id, up: 0, points: [[0, 0], [100, 0]] }
      const project = makeProject({
        ouvrages: [brokenOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [ca], traces: [trace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.recapConstituents[0].hasError).toBe(true)
    })
  })

  describe('liste détaillée par tracé', () => {
    it('Should list one entry per trace with its number, ouvrage name and subtotal', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.traces).toHaveLength(1)
      expect(data.traces[0].traceNumber).toBe(1)
      expect(data.traces[0].ouvrageName).toBe(usedOuvrage.name)
    })

    it('Should exclude a constituent line marked hideIfZero when its quantity is zero', () => {
      const zeroFormulaOuvrage: Ouvrage = {
        id: 'o-zero', name: 'Ouvrage zero', description: '', category: 'Test',
        constituents: [{ id: 'oc-zero', constituentId: usedConstituent.id, position: 1, formula: '0', hideIfZero: true }],
      }
      const ca: ColorAssignment = { id: 'ca-zero', color: '#000', ouvrageId: zeroFormulaOuvrage.id, epaisseur: 0.2, hauteur: 2.5 }
      const trace: LineTrace = { id: 't-zero', number: 1, type: 'line', colorAssignmentId: ca.id, up: 0, points: [[0, 0], [100, 0]] }
      const project = makeProject({
        ouvrages: [zeroFormulaOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [ca], traces: [trace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      expect(data.traces[0].constituents).toHaveLength(0)
    })

    it('Should sum every trace subtotal into the grand total', () => {
      const project = makeProject({
        ouvrages: [usedOuvrage],
        constituents: [usedConstituent],
        zones: [makeZone({ colorAssignments: [colorAssignment], traces: [drawnTrace] })],
      })

      const data = buildPrintData(project, project.zones[0])

      const expected = data.traces.reduce((sum, t) => sum + t.subtotal, 0)
      expect(data.grandTotal).toBe(expected)
    })
  })
})
