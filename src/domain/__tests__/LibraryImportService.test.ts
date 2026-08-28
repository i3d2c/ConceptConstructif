import { describe, it, expect } from 'vitest'
import { planImportConstituent, planImportOuvrage, findUnpublishedConstituents } from '../services/LibraryImportService'
import type { Constituent } from '../models/Constituent'
import type { Ouvrage } from '../models/Ouvrage'

const brick: Constituent = {
  id: 'lib-c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const cement: Constituent = {
  id: 'lib-c-2', name: 'Ciment', unit: 'sac 25kg', unitPrice: 5, category: 'Maçonnerie',
}
const brickWall: Ouvrage = {
  id: 'lib-o-1', name: 'Mur brique 1B', description: '', category: 'Maçonnerie',
  constituents: [
    { id: 'oc-1', constituentId: 'lib-c-1', position: 1, formula: 'L*H/(0.22*0.05)' },
    { id: 'oc-2', constituentId: 'lib-c-2', position: 2, formula: 'C1/300' },
  ],
}

describe('LibraryImportService — planImportConstituent', () => {
  it('Should copy the library constituent when it is not present locally', () => {
    const result = planImportConstituent([], brick)
    expect(result.alreadyPresent).toBe(false)
    expect(result.constituent).toEqual(brick)
  })

  it('Should reuse the existing local copy without modifying it when already present (same id)', () => {
    const localCopy: Constituent = { ...brick, unitPrice: 1.10 } // intentionally diverged local value
    const result = planImportConstituent([localCopy], brick)
    expect(result.alreadyPresent).toBe(true)
    expect(result.constituent).toBe(localCopy)
    expect(result.constituent.unitPrice).toBe(1.10)
  })
})

describe('LibraryImportService — planImportOuvrage', () => {
  it('Should not create any new constituent when all referenced constituents are already present locally', () => {
    const existingConstituents = [{ ...brick }, { ...cement }]
    const libraryConstituentsById = new Map([[brick.id, brick], [cement.id, cement]])

    const result = planImportOuvrage(existingConstituents, brickWall, libraryConstituentsById)

    expect(result.newConstituents).toEqual([])
    expect(result.ouvrage).toEqual(brickWall)
  })

  it('Should cascade-import referenced constituents that are missing locally', () => {
    const libraryConstituentsById = new Map([[brick.id, brick], [cement.id, cement]])

    const result = planImportOuvrage([], brickWall, libraryConstituentsById)

    expect(result.newConstituents).toEqual([brick, cement])
  })

  it('Should skip constituents already present and only copy the missing ones', () => {
    const existingConstituents = [{ ...brick }]
    const libraryConstituentsById = new Map([[brick.id, brick], [cement.id, cement]])

    const result = planImportOuvrage(existingConstituents, brickWall, libraryConstituentsById)

    expect(result.newConstituents).toEqual([cement])
  })

  it('Should preserve the constituentId of copied OuvrageConstituent entries (no remap needed, the id is already shared)', () => {
    const result = planImportOuvrage([], brickWall, new Map([[brick.id, brick], [cement.id, cement]]))

    expect(result.ouvrage.constituents.map(oc => oc.constituentId)).toEqual(['lib-c-1', 'lib-c-2'])
  })
})

describe('LibraryImportService — findUnpublishedConstituents', () => {
  const localBrick: Constituent = { ...brick, id: 'local-c-1' }
  const localCement: Constituent = { ...cement, id: 'local-c-2' }
  const localOuvrage: Ouvrage = {
    ...brickWall,
    id: 'local-o-1',
    constituents: [
      { id: 'oc-1', constituentId: 'local-c-1', position: 1, formula: 'L*H/(0.22*0.05)' },
      { id: 'oc-2', constituentId: 'local-c-2', position: 2, formula: 'C1/300' },
    ],
  }

  it('Should report nothing when all referenced constituents are already published to the library', () => {
    const localConstituents = [localBrick, localCement]
    const publishedIds = new Set(['local-c-1', 'local-c-2'])

    const result = findUnpublishedConstituents(localOuvrage, localConstituents, publishedIds)

    expect(result).toEqual([])
  })

  it('Should report referenced constituents that are not yet published', () => {
    const localConstituents = [localBrick, localCement]
    const publishedIds = new Set(['local-c-1']) // cement not yet published

    const result = findUnpublishedConstituents(localOuvrage, localConstituents, publishedIds)

    expect(result).toEqual([localCement])
  })
})
