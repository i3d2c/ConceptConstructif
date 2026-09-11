import type { Project } from '../domain/models/Project'
import type { Zone } from '../domain/models/Zone'
import type { OuvrageConstituent } from '../domain/models/Ouvrage'
import { computeTraceChiffrage } from '../domain/services/ChiffrageCalculator'
import type { TraceChiffrage } from '../domain/services/ChiffrageCalculator'
import { evaluateRecap } from '../domain/services/FormulaEvaluator'

export interface PrintOuvrageConstituentLine {
  ouvrageConstituentId: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  hasError: boolean
}

export interface PrintOuvrageRecap {
  ouvrageId: string
  ouvrageName: string
  total: number
  constituents: PrintOuvrageConstituentLine[]
}

export interface PrintDevisLine {
  ouvrageId: string
  ouvrageName: string
  description: string
  price: number
}

export interface PrintConstituentRecap {
  constituentId: string
  name: string
  supplier: string | null
  quantity: number
  unit: string
  unitPrice: number
  total: number
  hasError: boolean
}

export interface PrintTraceConstituentLine {
  ouvrageConstituentId: string
  name: string
  unit: string
  unitPrice: number
  quantity: number
  total: number
  error?: string
  hideIfZero?: boolean
  hideIfPriceZero?: boolean
}

export interface PrintTraceDetail {
  traceId: string
  traceNumber: number
  ouvrageId: string
  ouvrageName: string
  constituents: PrintTraceConstituentLine[]
  subtotal: number
}

export interface PrintData {
  recapOuvrages: PrintOuvrageRecap[]
  recapOuvrageTotal: number
  devisLines: PrintDevisLine[]
  devisTotal: number
  recapConstituents: PrintConstituentRecap[]
  recapConstituentTotal: number
  traces: PrintTraceDetail[]
  grandTotal: number
}

function applyRecap(formulaRecap: string | undefined, x: number): number {
  return formulaRecap ? evaluateRecap(formulaRecap, x) : x
}

function aggregatedQty(oc: OuvrageConstituent, traces: TraceChiffrage[]): number {
  return traces.flatMap(t => t.constituents)
    .filter(c => c.ouvrageConstituentId === oc.id)
    .reduce((sum, c) => sum + c.quantity, 0)
}

function hasError(oc: OuvrageConstituent, traces: TraceChiffrage[]): boolean {
  return traces.flatMap(t => t.constituents).some(c => c.ouvrageConstituentId === oc.id && c.error)
}

export function buildPrintData(project: Project, zone: Zone | undefined): PrintData {
  const empty: PrintData = {
    recapOuvrages: [], recapOuvrageTotal: 0,
    devisLines: [], devisTotal: 0,
    recapConstituents: [], recapConstituentTotal: 0,
    traces: [], grandTotal: 0,
  }
  if (!zone?.scale) return empty

  const scale = zone.scale
  const constituentsMap = new Map(project.constituents.map(c => [c.id, c]))

  const traceResults: TraceChiffrage[] = zone.traces
    .map(trace => {
      const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
      const ouvrage = project.ouvrages.find(o => o.id === ca?.ouvrageId)
      if (!ca || !ouvrage) return null
      return computeTraceChiffrage(trace, scale, ca, ouvrage, constituentsMap)
    })
    .filter((t): t is TraceChiffrage => t !== null)

  const usedOuvrages = project.ouvrages.filter(o => traceResults.some(t => t.ouvrageId === o.id))

  function visibleOCs(ouvrageId: string): OuvrageConstituent[] {
    const ouvrage = project.ouvrages.find(o => o.id === ouvrageId)
    if (!ouvrage) return []
    const scoped = traceResults.filter(t => t.ouvrageId === ouvrageId)
    return ouvrage.constituents.filter(oc => {
      const unitPrice = constituentsMap.get(oc.constituentId)?.unitPrice ?? 0
      return !oc.disabled
        && !oc.hideFromRecapOuvrage
        && !(oc.hideIfZero && aggregatedQty(oc, scoped) === 0)
        && !(oc.hideIfPriceZero && unitPrice === 0)
    })
  }

  function ouvrageAdjustedTotal(ouvrageId: string): number {
    const scoped = traceResults.filter(t => t.ouvrageId === ouvrageId)
    return visibleOCs(ouvrageId).reduce((sum, oc) => {
      const unitPrice = constituentsMap.get(oc.constituentId)?.unitPrice ?? 0
      return sum + aggregatedQty(oc, scoped) * unitPrice
    }, 0)
  }

  const recapOuvrages: PrintOuvrageRecap[] = usedOuvrages.map(o => {
    const scoped = traceResults.filter(t => t.ouvrageId === o.id)
    return {
      ouvrageId: o.id,
      ouvrageName: o.name,
      total: ouvrageAdjustedTotal(o.id),
      constituents: visibleOCs(o.id).map(oc => {
        const constituent = constituentsMap.get(oc.constituentId)
        const quantity = aggregatedQty(oc, scoped)
        return {
          ouvrageConstituentId: oc.id,
          name: constituent?.name ?? '',
          quantity,
          unit: constituent?.unit ?? '',
          unitPrice: constituent?.unitPrice ?? 0,
          total: quantity * (constituent?.unitPrice ?? 0),
          hasError: hasError(oc, scoped),
        }
      }),
    }
  })
  const recapOuvrageTotal = recapOuvrages.reduce((sum, o) => sum + o.total, 0)

  function constituentApplicableOCs(constituentId: string): OuvrageConstituent[] {
    const unitPrice = constituentsMap.get(constituentId)?.unitPrice ?? 0
    return usedOuvrages
      .flatMap(o => o.constituents)
      .filter(oc => oc.constituentId === constituentId && !oc.disabled && !oc.hideFromRecapConstituent)
      .filter(oc => !(oc.hideIfZero && aggregatedQty(oc, traceResults) === 0))
      .filter(oc => !(oc.hideIfPriceZero && unitPrice === 0))
  }

  const recapConstituents: PrintConstituentRecap[] = project.constituents
    .map(c => {
      const ocs = constituentApplicableOCs(c.id)
      if (ocs.length === 0) return null
      const rawQty = ocs.reduce((sum, oc) => sum + aggregatedQty(oc, traceResults), 0)
      const quantity = applyRecap(c.formulaRecap, rawQty)
      return {
        constituentId: c.id,
        name: c.name,
        supplier: c.supplier ?? null,
        quantity,
        unit: c.unit,
        unitPrice: c.unitPrice,
        total: quantity * c.unitPrice,
        hasError: ocs.some(oc => hasError(oc, traceResults)),
      }
    })
    .filter((c): c is PrintConstituentRecap => c !== null)
  const recapConstituentTotal = recapConstituents.reduce((sum, c) => sum + c.total, 0)

  const devisLines: PrintDevisLine[] = usedOuvrages.map(o => {
    const raw = ouvrageAdjustedTotal(o.id)
    const price = recapOuvrageTotal !== 0 ? raw * (recapConstituentTotal / recapOuvrageTotal) : raw
    return { ouvrageId: o.id, ouvrageName: o.name, description: o.description, price }
  })

  const traces: PrintTraceDetail[] = traceResults.map(t => ({
    traceId: t.traceId,
    traceNumber: t.traceNumber,
    ouvrageId: t.ouvrageId,
    ouvrageName: t.ouvrageName,
    subtotal: t.subtotal,
    constituents: t.constituents
      .filter(c => !(c.hideIfZero && c.quantity === 0) && !(c.hideIfPriceZero && c.unitPrice === 0))
      .map(c => ({
        ouvrageConstituentId: c.ouvrageConstituentId,
        name: c.name,
        unit: c.unit,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
        total: c.total,
        error: c.error,
        hideIfZero: c.hideIfZero,
        hideIfPriceZero: c.hideIfPriceZero,
      })),
  }))
  const grandTotal = traceResults.reduce((sum, t) => sum + t.subtotal, 0)

  return {
    recapOuvrages, recapOuvrageTotal,
    devisLines, devisTotal: recapConstituentTotal,
    recapConstituents, recapConstituentTotal,
    traces, grandTotal,
  }
}
