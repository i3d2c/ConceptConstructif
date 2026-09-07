import type { OuvrageConstituent } from '../models/Ouvrage'

function remapFormula(formula: string, oldOrderIds: string[], newPositionById: Map<string, number>): string {
  return formula.replace(/\bC(\d+)\b/g, (match, nStr: string) => {
    const oldPosition = Number(nStr)
    const id = oldOrderIds[oldPosition - 1]
    if (!id) return match
    const newPosition = newPositionById.get(id)
    return newPosition ? `C${newPosition}` : match
  })
}

export function reorderOuvrageConstituents(
  constituents: OuvrageConstituent[],
  fromIndex: number,
  toIndex: number,
): OuvrageConstituent[] {
  const ordered = [...constituents].sort((a, b) => a.position - b.position)
  const oldOrderIds = ordered.map(oc => oc.id)

  const [moved] = ordered.splice(fromIndex, 1)
  ordered.splice(toIndex, 0, moved)

  const newPositionById = new Map(ordered.map((oc, i) => [oc.id, i + 1]))

  return ordered.map((oc, i) => ({
    ...oc,
    position: i + 1,
    formula: remapFormula(oc.formula, oldOrderIds, newPositionById),
  }))
}
