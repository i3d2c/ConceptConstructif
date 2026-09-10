import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '../projectStore'
import { loadProject } from '../../storage/ProjectStore'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import type { Trace } from '../../domain/models/Trace'
import type { ColorAssignment } from '../../domain/models/Zone'
import type { Project } from '../../domain/models/Project'

vi.mock('../../storage/ProjectStore')

const brick: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const cement: Constituent = {
  id: 'c-2', name: 'Ciment', unit: 'sac 25kg', unitPrice: 5, category: 'Maçonnerie',
}
const brickWall: Ouvrage = {
  id: 'o-1', name: 'Mur brique 1B', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L*H/(0.22*0.05)' }],
}

describe('projectStore — library cascade actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('importOuvrageFromLibrary', () => {
    it('Should import an ouvrage from the library and cascade its missing constituents', () => {
      const store = useProjectStore()
      const libraryConstituentsById = new Map([[brick.id, brick], [cement.id, cement]])

      const result = store.importOuvrageFromLibrary(brickWall, libraryConstituentsById)

      expect(result).toBe(true)
      expect(store.project.ouvrages).toEqual([brickWall])
      expect(store.project.constituents).toEqual([brick])
    })

    it('Should not import an ouvrage that is already present locally (same id)', () => {
      const store = useProjectStore()
      store.project.ouvrages.push({ ...brickWall })
      const libraryConstituentsById = new Map([[brick.id, brick], [cement.id, cement]])

      const result = store.importOuvrageFromLibrary(brickWall, libraryConstituentsById)

      expect(result).toBe(false)
      expect(store.project.ouvrages).toHaveLength(1)
      expect(store.project.constituents).toEqual([])
    })
  })

  describe('importConstituentFromLibrary', () => {
    it('Should import a constituent from the library when absent locally', () => {
      const store = useProjectStore()

      const result = store.importConstituentFromLibrary(brick)

      expect(result).toBe(true)
      expect(store.project.constituents).toEqual([brick])
    })

    it('Should not import a constituent that is already present locally, leaving its diverged value untouched', () => {
      const store = useProjectStore()
      store.project.constituents.push({ ...brick, unitPrice: 1.5 })

      const result = store.importConstituentFromLibrary(brick)

      expect(result).toBe(false)
      expect(store.project.constituents[0].unitPrice).toBe(1.5)
    })
  })

  describe('updateOuvrageFromLibrary', () => {
    it('Should update a locally-linked ouvrage from its current library version and cascade any newly referenced constituent, without touching already-present diverged constituents', () => {
      const store = useProjectStore()
      const divergedBrick: Constituent = { ...brick, unitPrice: 1.5 }
      store.project.ouvrages.push({ ...brickWall })
      store.project.constituents.push(divergedBrick)

      const updatedLibraryOuvrage: Ouvrage = {
        ...brickWall,
        name: 'Mur brique 20cm',
        constituents: [
          { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L*H/(0.22*0.05)' },
          { id: 'oc-2', constituentId: 'c-2', position: 2, formula: 'C1/300' },
        ],
      }
      const libraryConstituentsById = new Map([[brick.id, brick], [cement.id, cement]])

      const result = store.updateOuvrageFromLibrary(updatedLibraryOuvrage, libraryConstituentsById)

      expect(result).toBe(true)
      expect(store.project.ouvrages[0]).toEqual(updatedLibraryOuvrage)
      expect(store.project.constituents).toEqual([divergedBrick, cement])
    })

    it('Should do nothing when updating an ouvrage that has no local counterpart', () => {
      const store = useProjectStore()
      const libraryConstituentsById = new Map([[brick.id, brick]])

      const result = store.updateOuvrageFromLibrary(brickWall, libraryConstituentsById)

      expect(result).toBe(false)
      expect(store.project.ouvrages).toEqual([])
    })
  })
})

const ca: ColorAssignment = { id: 'ca-1', color: '#ff0000', ouvrageId: 'o-1', epaisseur: 0.2, hauteur: 2.5 }
const lineTrace: Trace = { id: 't-1', number: 1, type: 'line', colorAssignmentId: 'ca-1', up: 0, points: [[0, 0], [1, 1]] }
const otherTrace: Trace = { id: 't-2', number: 2, type: 'line', colorAssignmentId: 'ca-1', up: 0, points: [[0, 0], [2, 2]] }

describe('projectStore — trace selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('selectedTrace', () => {
    it('Should have no selected trace by default', () => {
      const store = useProjectStore()

      expect(store.selectedTraceId).toBeNull()
      expect(store.selectedTrace).toBeNull()
    })

    it('Should resolve selectedTrace from selectedTraceId within the active zone', () => {
      const store = useProjectStore()
      store.addTrace(store.activeZone!.id, lineTrace)

      store.selectedTraceId = lineTrace.id

      expect(store.selectedTrace).toEqual(lineTrace)
    })

    it('Should resolve selectedTrace to null when selectedTraceId matches no trace', () => {
      const store = useProjectStore()

      store.selectedTraceId = 'unknown-id'

      expect(store.selectedTrace).toBeNull()
    })
  })

  describe('setActiveZone', () => {
    it('Should clear the selection when switching the active zone', () => {
      const store = useProjectStore()
      store.addTrace(store.activeZone!.id, lineTrace)
      store.selectedTraceId = lineTrace.id
      const zoneId = store.activeZone!.id
      store.addZone({ id: 'zone-2', name: 'Zone 2', scale: null, backgroundImage: null, colorAssignments: [], traces: [], printConfig: defaultPrintConfig() })

      store.setActiveZone(zoneId)

      expect(store.selectedTraceId).toBeNull()
    })
  })

  describe('removeTrace', () => {
    it('Should clear the selection when the selected trace is removed', () => {
      const store = useProjectStore()
      const zoneId = store.activeZone!.id
      store.addTrace(zoneId, lineTrace)
      store.selectedTraceId = lineTrace.id

      store.removeTrace(zoneId, lineTrace.id)

      expect(store.selectedTraceId).toBeNull()
    })

    it('Should keep the selection when a different trace is removed', () => {
      const store = useProjectStore()
      const zoneId = store.activeZone!.id
      store.addTrace(zoneId, lineTrace)
      store.addTrace(zoneId, otherTrace)
      store.selectedTraceId = lineTrace.id

      store.removeTrace(zoneId, otherTrace.id)

      expect(store.selectedTraceId).toBe(lineTrace.id)
    })
  })

  describe('duplicateTrace', () => {
    it('Should push a new trace with a fresh id, an incremented number and offset points', () => {
      const store = useProjectStore()
      const zoneId = store.activeZone!.id
      store.addTrace(zoneId, lineTrace)
      store.addTrace(zoneId, otherTrace)

      store.duplicateTrace(zoneId, lineTrace.id)

      expect(store.activeZone!.traces).toHaveLength(3)
      const duplicate = store.activeZone!.traces[2]
      expect(duplicate.id).not.toBe(lineTrace.id)
      expect(duplicate.number).toBe(3)
      expect(duplicate.points).toEqual([[20, 20], [21, 21]])
    })

    it('Should select the newly duplicated trace', () => {
      const store = useProjectStore()
      const zoneId = store.activeZone!.id
      store.addTrace(zoneId, lineTrace)
      store.selectedTraceId = lineTrace.id

      store.duplicateTrace(zoneId, lineTrace.id)

      const duplicate = store.activeZone!.traces[1]
      expect(store.selectedTraceId).toBe(duplicate.id)
    })

    it("Should not mutate the original trace's points", () => {
      const store = useProjectStore()
      const zoneId = store.activeZone!.id
      store.addTrace(zoneId, lineTrace)

      store.duplicateTrace(zoneId, lineTrace.id)

      expect(store.activeZone!.traces[0].points).toEqual([[0, 0], [1, 1]])
    })
  })

  describe('removeColorAssignment', () => {
    it('Should clear the selection when the color assignment cascade-removes the selected trace', () => {
      const store = useProjectStore()
      const zoneId = store.activeZone!.id
      store.addColorAssignment(zoneId, ca)
      store.addTrace(zoneId, lineTrace)
      store.selectedTraceId = lineTrace.id

      store.removeColorAssignment(zoneId, ca.id)

      expect(store.selectedTraceId).toBeNull()
    })
  })

  describe('showNumbers', () => {
    it('Should be hidden by default', () => {
      const store = useProjectStore()

      expect(store.showNumbers).toBe(false)
    })
  })

  describe('setSelectedCaId', () => {
    it('Should switch the draw mode to "line" when selecting a color while in "select" mode', () => {
      const store = useProjectStore()
      store.setDrawMode('select')

      store.setSelectedCaId(ca.id)

      expect(store.drawMode).toBe('line')
    })

    it('Should switch the draw mode to "line" when selecting a color while in "scale" mode', () => {
      const store = useProjectStore()
      store.setDrawMode('scale')

      store.setSelectedCaId(ca.id)

      expect(store.drawMode).toBe('line')
    })

    it('Should keep the draw mode as "surface" when selecting a color while already tracing a surface', () => {
      const store = useProjectStore()
      store.setDrawMode('surface')

      store.setSelectedCaId(ca.id)

      expect(store.drawMode).toBe('surface')
    })

    it('Should keep the draw mode as "line" when selecting a color while already tracing a line', () => {
      const store = useProjectStore()
      store.setDrawMode('line')

      store.setSelectedCaId(ca.id)

      expect(store.drawMode).toBe('line')
    })

    it('Should not change the draw mode when clearing the selection', () => {
      const store = useProjectStore()
      store.setDrawMode('select')

      store.setSelectedCaId(null)

      expect(store.drawMode).toBe('select')
    })
  })
})

describe('projectStore — print config persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('a freshly created project', () => {
    it('Should give the initial zone a default printConfig', () => {
      const store = useProjectStore()

      expect(store.activeZone!.printConfig).toEqual(defaultPrintConfig())
    })
  })

  describe('load', () => {
    it('Should default a zone printConfig to defaultPrintConfig() when loading a project saved before that field existed', async () => {
      const legacyProject = {
        id: 'p-legacy',
        name: 'Ancien projet',
        ouvrages: [],
        constituents: [],
        zones: [{ id: 'z-1', name: 'Zone 1', scale: null, backgroundImage: null, colorAssignments: [], traces: [] }],
        activeZoneId: 'z-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Project
      vi.mocked(loadProject).mockResolvedValue(legacyProject)
      const store = useProjectStore()

      await store.load('p-legacy')

      expect(store.activeZone!.printConfig).toEqual(defaultPrintConfig())
    })
  })
})
