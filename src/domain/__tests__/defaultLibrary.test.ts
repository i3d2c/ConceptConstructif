import { describe, it, expect } from 'vitest'
import defaultLibrary from '../data/defaultLibrary.json'

describe('defaultLibrary', () => {
  it('Should reference only constituent ids present in the default library', () => {
    const constituentIds = new Set(defaultLibrary.constituents.map(c => c.id))
    const missing = defaultLibrary.ouvrages
      .flatMap(o => o.constituents)
      .map(oc => oc.constituentId)
      .filter(id => !constituentIds.has(id))

    expect(missing).toEqual([])
  })

  it('Should use unique ids across all seed ouvrages and constituents', () => {
    const ouvrageIds = defaultLibrary.ouvrages.map(o => o.id)
    const constituentIds = defaultLibrary.constituents.map(c => c.id)

    expect(new Set(ouvrageIds).size).toBe(ouvrageIds.length)
    expect(new Set(constituentIds).size).toBe(constituentIds.length)
  })
})
