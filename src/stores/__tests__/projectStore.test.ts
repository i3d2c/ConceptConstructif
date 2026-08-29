import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '../projectStore'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'

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
