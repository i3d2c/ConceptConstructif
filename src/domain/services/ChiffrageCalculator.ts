import type { Scale } from '../models/Scale'
import type { ColorAssignment } from '../models/Zone'
import type { Ouvrage, OuvrageConstituent } from '../models/Ouvrage'
import type { Constituent } from '../models/Constituent'
import type { Trace } from '../models/Trace'
import { computePolygonArea, applyAngle } from './SurfaceCalculator'
import { evaluateFormula } from './FormulaEvaluator'
import type { FormulaVariables } from './FormulaEvaluator'

export interface FormulaVars {
  L: number
  H: number
  E: number
  S: number
  V: number
  [key: string]: number
}

export interface ConstituentResult {
  ouvrageConstituentId: string
  constituentId: string
  name: string
  unit: string
  unitPrice: number
  supplier?: string
  url?: string
  quantity: number
  total: number
}

export interface TraceChiffrage {
  traceId: string
  traceNumber: number
  ouvrageId: string
  ouvrageName: string
  vars: FormulaVars
  constituents: ConstituentResult[]
  subtotal: number
}

export interface ZoneChiffrage {
  zoneId: string
  zoneName: string
  traces: TraceChiffrage[]
  grandTotal: number
}

export function computeTraceVariables(
  type: 'line' | 'surface',
  points: [number, number][],
  scale: Scale,
  ca: ColorAssignment,
  angleDeg = 0,
): FormulaVars {
  const ratio = scale.ratio
  const E = ca.epaisseur
  const H = ca.hauteur

  if (type === 'line') {
    let pixelLen = 0
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1][0] - points[i][0]
      const dy = points[i + 1][1] - points[i][1]
      pixelLen += Math.sqrt(dx * dx + dy * dy)
    }
    const L = pixelLen * ratio
    const S = L * H
    const V = S * E
    return { L, H, E, S, V }
  } else {
    // Surface
    const pixelArea = computePolygonArea(points)
    const projectedArea = pixelArea * ratio * ratio
    const S = applyAngle(projectedArea, angleDeg)
    const V = S * E

    const xs = points.map(p => p[0])
    const ys = points.map(p => p[1])
    const L = (Math.max(...xs) - Math.min(...xs)) * ratio
    const H_bbox = (Math.max(...ys) - Math.min(...ys)) * ratio

    return { L, H: H_bbox, E, S, V }
  }
}

export function computeTraceChiffrage(
  trace: Trace,
  scale: Scale,
  ca: ColorAssignment,
  ouvrage: Ouvrage,
  constituentsMap: Map<string, Constituent>,
): TraceChiffrage {
  const angleDeg = trace.type === 'surface' ? (trace.angle ?? 0) : 0
  const baseVars = computeTraceVariables(trace.type, trace.points, scale, ca, angleDeg)

  const sortedOC = [...ouvrage.constituents].sort((a, b) => a.position - b.position)

  const constituentResults: ConstituentResult[] = []
  const cascadeVars: FormulaVariables = { ...baseVars }

  for (const oc of sortedOC) {
    const constituent = constituentsMap.get(oc.constituentId)
    if (!constituent) continue

    const quantity = evaluateFormula(oc.formula, cascadeVars)
    cascadeVars[`C${oc.position}`] = quantity

    constituentResults.push({
      ouvrageConstituentId: oc.id,
      constituentId: constituent.id,
      name: constituent.name,
      unit: constituent.unit,
      unitPrice: constituent.unitPrice,
      supplier: constituent.supplier,
      url: constituent.url,
      quantity,
      total: quantity * constituent.unitPrice,
    })
  }

  const subtotal = constituentResults.reduce((sum, c) => sum + c.total, 0)

  return {
    traceId: trace.id,
    traceNumber: trace.number,
    ouvrageId: ouvrage.id,
    ouvrageName: ouvrage.name,
    vars: baseVars,
    constituents: constituentResults,
    subtotal,
  }
}
