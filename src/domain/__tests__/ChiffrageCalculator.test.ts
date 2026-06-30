import { describe, it, expect } from 'vitest'
import { computeTraceVariables, computeTraceChiffrage } from '../services/ChiffrageCalculator'
import type { Scale } from '../models/Scale'
import type { ColorAssignment } from '../models/Zone'
import type { Ouvrage } from '../models/Ouvrage'
import type { Constituent } from '../models/Constituent'
import type { LineTrace } from '../models/Trace'

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

describe('ChiffrageCalculator', () => {
  it('calcule L comme somme des segments pour un LineTrace', () => {
    // Mur en L : segment 1 = 60px (3m) + segment 2 = 80px (4m) → L = 7m
    const points: [number, number][] = [[0, 0], [60, 0], [60, 80]]
    const vars = computeTraceVariables('line', points, scale, colorAssignment)
    expect(vars.L).toBeCloseTo(7)
  })

  it('calcule S = L × H et V = S × E pour un LineTrace', () => {
    const points: [number, number][] = [[0, 0], [60, 0]]
    const vars = computeTraceVariables('line', points, scale, colorAssignment)
    expect(vars.S).toBeCloseTo(7.5)
    expect(vars.V).toBeCloseTo(0.7875)
  })

  it('calcule S réelle avec correction angle pour un SurfaceTrace (60°)', () => {
    // Rectangle 4m × 3m en pixels = 80px × 60px, aire projetée = 12m²
    // angle 60° → S_réelle = 12 / cos(60°) = 24m²
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables('surface', points, scale, colorAssignment, 60)
    expect(vars.S).toBeCloseTo(24)
  })

  it('SurfaceTrace : L et H sont les dimensions de la bounding box', () => {
    const points: [number, number][] = [[0, 0], [80, 0], [80, 60], [0, 60]]
    const vars = computeTraceVariables('surface', points, scale, colorAssignment)
    expect(vars.L).toBeCloseTo(4) // 80px * 0.05
    expect(vars.H).toBeCloseTo(3) // 60px * 0.05
  })

  it('computeTraceChiffrage gère la cascade Cn entre constituants', () => {
    const brique: Constituent = { id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92 }
    const ciment: Constituent = { id: 'c-2', name: 'Ciment', unit: 'sac 25kg', unitPrice: 5 }
    const constituentsMap = new Map<string, Constituent>([['c-1', brique], ['c-2', ciment]])

    const ouvrage: Ouvrage = {
      id: 'o-1', name: 'Mur', description: '',
      constituents: [
        { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L * H / (0.220 * 0.050)' },
        { id: 'oc-2', constituentId: 'c-2', position: 2, formula: 'C1 / 300' },
      ],
    }

    const trace: LineTrace = {
      id: 't-1', type: 'line', number: 1, colorAssignmentId: 'ca-1', up: 0,
      points: [[0, 0], [60, 0]], // L = 3m
    }

    const result = computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)
    // C2 = C1/300 = ~681.81/300 ≈ 2.27
    expect(result.constituents[1].quantity).toBeCloseTo(681.81 / 300, 2)
  })

  it('computeTraceChiffrage calcule ~681 briques pour un mur 3m × 2.5m', () => {
    const brique: Constituent = { id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92 }
    const constituentsMap = new Map<string, Constituent>([['c-1', brique]])

    const ouvrage: Ouvrage = {
      id: 'o-1',
      name: 'Mur brique 1B',
      description: '',
      constituents: [
        { id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L * H / (0.220 * 0.050)' },
      ],
    }

    const trace: LineTrace = {
      id: 't-1',
      type: 'line',
      number: 1,
      colorAssignmentId: 'ca-1',
      up: 0,
      points: [[0, 0], [60, 0]], // 60px * 0.05 = 3m
    }

    const result = computeTraceChiffrage(trace, scale, colorAssignment, ouvrage, constituentsMap)
    expect(result.constituents[0].quantity).toBeCloseTo(681.81, 0)
    expect(result.constituents[0].total).toBeCloseTo(627.27, 0)
  })
})
