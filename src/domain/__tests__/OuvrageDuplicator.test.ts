import { describe, it, expect } from 'vitest'
import { duplicateOuvrage } from '../services/OuvrageDuplicator'
import type { Ouvrage } from '../models/Ouvrage'

const baseOuvrage: Ouvrage = {
  id: 'o-1',
  name: 'Mur brique 1 brique',
  description: 'Mur en brique pleine',
  defaultEpaisseur: 0.105,
  defaultHauteur: 2.5,
  category: 'Murs',
  constituents: [
    { id: 'oc-1', constituentId: 'c-brique', position: 1, formula: 'L * H' },
    { id: 'oc-2', constituentId: 'c-mortier', position: 2, formula: 'C1 * 0.02' },
  ],
}

describe('duplicateOuvrage', () => {
  it('should create a copy with a new id', () => {
    const copy = duplicateOuvrage(baseOuvrage, 'o-copy')
    expect(copy.id).toBe('o-copy')
    expect(copy.id).not.toBe(baseOuvrage.id)
  })

  it('should deep copy so mutating the copy does not affect the original', () => {
    const copy = duplicateOuvrage(baseOuvrage, 'o-copy')
    copy.constituents[0].formula = 'S * H'
    expect(baseOuvrage.constituents[0].formula).toBe('L * H')
  })

  it('should regenerate every constituent row id while keeping constituentId, position and formula', () => {
    const copy = duplicateOuvrage(baseOuvrage, 'o-copy')

    expect(copy.constituents).toHaveLength(2)
    copy.constituents.forEach((oc, i) => {
      expect(oc.id).not.toBe(baseOuvrage.constituents[i].id)
      expect(oc.constituentId).toBe(baseOuvrage.constituents[i].constituentId)
      expect(oc.position).toBe(baseOuvrage.constituents[i].position)
      expect(oc.formula).toBe(baseOuvrage.constituents[i].formula)
    })
    expect(copy.constituents[0].id).not.toBe(copy.constituents[1].id)
  })

  it('should use the provided name or default to "(copie)"', () => {
    const withName = duplicateOuvrage(baseOuvrage, 'o-copy', 'Mur brique 1/2 brique')
    expect(withName.name).toBe('Mur brique 1/2 brique')

    const withDefault = duplicateOuvrage(baseOuvrage, 'o-copy2')
    expect(withDefault.name).toBe('Mur brique 1 brique (copie)')
  })
})
