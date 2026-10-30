import { describe, it, expect } from 'vitest'
import { computeTraceVariables, computeTraceChiffrage } from '../services/ChiffrageCalculator'
import type { Scale } from '../models/Scale'
import type { ColorAssignment } from '../models/Zone'
import type { Ouvrage } from '../models/Ouvrage'
import type { Constituent } from '../models/Constituent'
import type { LineTrace, SurfaceTrace, SlopeDirection, ProfilePoint } from '../models/Trace'
import { defaultProfile } from '../services/WallProfile'

const scale: Scale = {
  pixelLength: 100,
  realLength: 5,
  ratio: 0.05,
  tracePoints: [[0, 0], [100, 0]],
}

const colorAssignment: ColorAssignment = {
  id: 'ca-1',
  color: '#ff0000',
  ouvrageId: 'o-1',
  epaisseur: 0.105,
  hauteur: 2.5,
}

function lineTrace(points: [number, number][], profile: ProfilePoint[] = defaultProfile()): LineTrace {
  return { id: 't-1', type: 'line', number: 1, colorAssignmentId: 'ca-1', up: 0, profile, points }
}

function surfaceTrace(points: [number, number][], angle = 0, slopeDirection: SlopeDirection = 'top'): SurfaceTrace {
  return { id: 't-1', type: 'surface', number: 1, colorAssignmentId: 'ca-1', up: 0, points, angle, slopeDirection }
}

describe('ChiffrageCalculator', () => {
  it('calcule L comme somme des segments pour un LineTrace', () => {
    // Mur en L : segment 1 = 60px (3m) + segment 2 = 80px (4m) → L = 7m
    const points: [number, number][] = [[0, 0], [60, 0], [60, 80]]
    const vars = computeTraceVariables(lineTrace(points), scale, colorAssignment)
    expect(vars.L).toBeCloseTo(7)
  })

  it('calcule S = L × H et V = S × E pour un LineTrace', () => {
    const points: [number, number][] = [[0, 0], [60, 0]]
    const vars = computeTraceVariables(lineTrace(points), scale, colorAssignment)
    expect(vars.S).toBeCloseTo(7.5)
    expect(vars.V).toBeCloseTo(0.7875)
  })

  it('calcule S réelle avec correction angle pour un SurfaceTrace (60°)', () => {
    // Rectangle 4m × 3m en pixels = 80px × 60px, aire projetée = 12m²
    // angle 60° → S_réelle = 12 / cos(60°) = 24m²
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables(surfaceTrace(points, 60), scale, colorAssignment)
    expect(vars.S).toBeCloseTo(24)
  })

  it('SurfaceTrace : L et H sont les dimensions de la bounding box', () => {
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables(surfaceTrace(points), scale, colorAssignment)
    expect(vars.L).toBeCloseTo(4) // 80px * 0.05
    expect(vars.H).toBeCloseTo(3) // 60px * 0.05
  })

  it('should compute S, H and Hmax of a gable wall from its height profile', () => {
    const gable = [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }]
    const vars = computeTraceVariables(lineTrace([[0, 0], [200, 0]], gable), scale, colorAssignment)
    expect(vars.L).toBeCloseTo(10)
    expect(vars.S).toBeCloseTo(37.5)
    expect(vars.H).toBeCloseTo(3.75)
    expect(vars.Hmax).toBeCloseTo(5)
  })

  it('should compute S of a raking wall from its two end heights', () => {
    const raking = [{ at: 0, offset: 0 }, { at: 1, offset: 1.5 }]
    const vars = computeTraceVariables(lineTrace([[0, 0], [200, 0]], raking), scale, colorAssignment)
    expect(vars.S).toBeCloseTo(32.5)
    expect(vars.Hmax).toBeCloseTo(4)
  })

  it('should give a zero-length wall the mean height of its profile and no surface', () => {
    const gable = [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }]
    const vars = computeTraceVariables(lineTrace([[0, 0], [0, 0]], gable), scale, colorAssignment)
    expect(vars.H).toBeCloseTo(3.75)
    expect(vars.Hmax).toBeCloseTo(5)
    expect(vars.S).toBe(0)
  })

  it('should give a surface an Hmax equal to its H', () => {
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables(surfaceTrace(points, 30), scale, colorAssignment)
    expect(vars.Hmax).toBe(vars.H)
  })

  it('should stretch H by the slope when a surface tilts towards the top', () => {
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables(surfaceTrace(points, 60, 'top'), scale, colorAssignment)
    expect(vars.L).toBeCloseTo(4)
    expect(vars.H).toBeCloseTo(6)
  })

  it('should stretch L by the slope when a surface tilts towards the left', () => {
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables(surfaceTrace(points, 60, 'left'), scale, colorAssignment)
    expect(vars.L).toBeCloseTo(8)
    expect(vars.H).toBeCloseTo(3)
  })

  it('should keep L × H equal to S for a tilted rectangle', () => {
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables(surfaceTrace(points, 45, 'bottom'), scale, colorAssignment)
    expect(vars.L * vars.H).toBeCloseTo(vars.S)
  })

  it('computeTraceChiffrage gère la cascade Cn entre constituants', () => {
    const brique: Constituent = { id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie' }
    const ciment: Constituent = { id: 'c-2', name: 'Ciment', unit: 'sac 25kg', unitPrice: 5, category: 'Maçonnerie' }
    const constituentsMap = new Map<string, Constituent>([['c-1', brique], ['c-2', ciment]])

    const ouvrage: Ouvrage = {
      id: 'o-1', name: 'Mur', description: '', category: 'Maçonnerie',
      constituents: [
        { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L * H / (0.220 * 0.050)' },
        { id: 'oc-2', constituentId: 'c-2', position: 2, formula: 'C1 / 300' },
      ],
    }

    const trace: LineTrace = {
      id: 't-1', type: 'line', number: 1, colorAssignmentId: 'ca-1', up: 0, profile: defaultProfile(),
      points: [[0, 0], [60, 0]], // L = 3m
    }

    const result = computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)
    // C2 = C1/300 = ~681.81/300 ≈ 2.27
    expect(result.constituents[1].quantity).toBeCloseTo(681.81 / 300, 2)
  })

  it('computeTraceChiffrage calcule ~681 briques pour un mur 3m × 2.5m', () => {
    const brique: Constituent = { id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie' }
    const constituentsMap = new Map<string, Constituent>([['c-1', brique]])

    const ouvrage: Ouvrage = {
      id: 'o-1',
      name: 'Mur brique 1B',
      description: '',
      category: 'Maçonnerie',
      constituents: [
        { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L * H / (0.220 * 0.050)' },
      ],
    }

    const trace: LineTrace = {
      id: 't-1',
      type: 'line',
      number: 1,
      colorAssignmentId: 'ca-1',
      up: 0, profile: defaultProfile(),
      points: [[0, 0], [60, 0]], // 60px * 0.05 = 3m
    }

    const result = computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)
    expect(result.constituents[0].quantity).toBeCloseTo(681.81, 0)
    expect(result.constituents[0].total).toBeCloseTo(627.27, 0)
  })

  it('should mark a constituent as errored instead of throwing when its formula is invalid', () => {
    const brique: Constituent = { id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie' }
    const constituentsMap = new Map<string, Constituent>([['c-1', brique]])

    const ouvrage: Ouvrage = {
      id: 'o-1', name: 'Mur', description: '', category: 'Maçonnerie',
      constituents: [
        { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'C99' },
      ],
    }

    const trace: LineTrace = {
      id: 't-1', type: 'line', number: 1, colorAssignmentId: 'ca-1', up: 0, profile: defaultProfile(),
      points: [[0, 0], [60, 0]],
    }

    expect(() => computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)).not.toThrow()
    const result = computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)
    expect(result.constituents[0].error).toBeTruthy()
    expect(result.constituents[0].quantity).toBe(0)
  })

  it('should still compute the constituents after an errored one, using zero as its cascade value', () => {
    const brique: Constituent = { id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie' }
    const ciment: Constituent = { id: 'c-2', name: 'Ciment', unit: 'sac 25kg', unitPrice: 5, category: 'Maçonnerie' }
    const constituentsMap = new Map<string, Constituent>([['c-1', brique], ['c-2', ciment]])

    const ouvrage: Ouvrage = {
      id: 'o-1', name: 'Mur', description: '', category: 'Maçonnerie',
      constituents: [
        { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'C99' },
        { id: 'oc-2', constituentId: 'c-2', position: 2, formula: 'C1 + 5' },
      ],
    }

    const trace: LineTrace = {
      id: 't-1', type: 'line', number: 1, colorAssignmentId: 'ca-1', up: 0, profile: defaultProfile(),
      points: [[0, 0], [60, 0]],
    }

    const result = computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)
    expect(result.constituents[0].error).toBeTruthy()
    expect(result.constituents[1].error).toBeFalsy()
    expect(result.constituents[1].quantity).toBe(5)
  })
})
