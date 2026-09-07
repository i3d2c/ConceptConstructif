import { describe, it, expect } from 'vitest'
import { reorderOuvrageConstituents } from '../services/OuvrageReorderService'
import type { OuvrageConstituent } from '../models/Ouvrage'

function makeOC(id: string, position: number, formula: string): OuvrageConstituent {
  return { id, constituentId: `constituent-${id}`, position, formula }
}

describe('reorderOuvrageConstituents', () => {
  it("should rewrite formula references to follow the moved constituent's new position", () => {
    const constituents: OuvrageConstituent[] = [
      makeOC('id1', 1, 'L * H'),
      makeOC('id2', 2, 'C1 * 2'),
      makeOC('id3', 3, 'C2 * 2'),
      makeOC('id4', 4, 'C1 + C2 + C3'),
      makeOC('id5', 5, ''),
    ]

    const result = reorderOuvrageConstituents(constituents, 4, 1)

    const byId = new Map(result.map(oc => [oc.id, oc]))
    expect(byId.get('id1')).toMatchObject({ position: 1, formula: 'L * H' })
    expect(byId.get('id5')).toMatchObject({ position: 2, formula: '' })
    expect(byId.get('id2')).toMatchObject({ position: 3, formula: 'C1 * 2' })
    expect(byId.get('id3')).toMatchObject({ position: 4, formula: 'C3 * 2' })
    expect(byId.get('id4')).toMatchObject({ position: 5, formula: 'C1 + C3 + C4' })
  })

  it('should renumber all positions sequentially after the move', () => {
    const constituents: OuvrageConstituent[] = [
      makeOC('id1', 1, ''),
      makeOC('id2', 2, ''),
      makeOC('id3', 3, ''),
    ]

    const result = reorderOuvrageConstituents(constituents, 0, 2)

    expect(result.map(oc => oc.position)).toEqual([1, 2, 3])
    expect(result.map(oc => oc.id)).toEqual(['id2', 'id3', 'id1'])
  })

  it('should leave a formula unchanged when it references a constituent whose position did not change', () => {
    const constituents: OuvrageConstituent[] = [
      makeOC('id1', 1, 'L * H'),
      makeOC('id2', 2, 'C1 * 2'),
      makeOC('id3', 3, ''),
    ]

    const result = reorderOuvrageConstituents(constituents, 2, 1)

    const byId = new Map(result.map(oc => [oc.id, oc]))
    expect(byId.get('id2')?.formula).toBe('C1 * 2')
  })

  it('should not confuse a two-digit reference like C15 with C1 when remapping', () => {
    const constituents: OuvrageConstituent[] = Array.from({ length: 16 }, (_, i) =>
      makeOC(`id${i + 1}`, i + 1, i === 15 ? 'C1 + C15' : ''),
    )

    const result = reorderOuvrageConstituents(constituents, 0, 5)

    const byId = new Map(result.map(oc => [oc.id, oc]))
    // id1 moved from position 1 to position 6; id16 (holder of the formula) stays at position 16
    expect(byId.get('id16')).toMatchObject({ position: 16, formula: 'C6 + C15' })
  })
})
