import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLibraryStore } from '../libraryStore'
import * as LibraryStorage from '../../storage/LibraryStore'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'

vi.mock('../../storage/LibraryStore')

const brick: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const brickWall: Ouvrage = {
  id: 'o-1', name: 'Mur brique 1B', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L*H/(0.22*0.05)' }],
}

describe('libraryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('Should populate ouvrages and constituents from storage on loadLibrary', async () => {
    vi.mocked(LibraryStorage.listLibraryOuvrages).mockResolvedValue([brickWall])
    vi.mocked(LibraryStorage.listLibraryConstituents).mockResolvedValue([brick])

    const store = useLibraryStore()
    await store.loadLibrary()

    expect(store.ouvrages).toEqual([brickWall])
    expect(store.constituents).toEqual([brick])
  })

  it('Should persist a new ouvrage and add it to local state', async () => {
    const store = useLibraryStore()

    await store.upsertOuvrage(brickWall)

    expect(LibraryStorage.saveLibraryOuvrage).toHaveBeenCalledWith(brickWall)
    expect(store.ouvrages).toEqual([brickWall])
  })

  it('Should persist an updated ouvrage and replace it in local state (same id)', async () => {
    const store = useLibraryStore()
    await store.upsertOuvrage(brickWall)

    const updated = { ...brickWall, name: 'Mur brique 20cm' }
    await store.upsertOuvrage(updated)

    expect(store.ouvrages).toEqual([updated])
  })

  it('Should persist a new constituent and add it to local state', async () => {
    const store = useLibraryStore()

    await store.upsertConstituent(brick)

    expect(LibraryStorage.saveLibraryConstituent).toHaveBeenCalledWith(brick)
    expect(store.constituents).toEqual([brick])
  })

  it('Should persist an updated constituent and replace it in local state (same id)', async () => {
    const store = useLibraryStore()
    await store.upsertConstituent(brick)

    const updated = { ...brick, unitPrice: 1.05 }
    await store.upsertConstituent(updated)

    expect(store.constituents).toEqual([updated])
  })

  it('Should delete an ouvrage from storage and remove it from local state', async () => {
    const store = useLibraryStore()
    await store.upsertOuvrage(brickWall)

    await store.removeOuvrage(brickWall.id)

    expect(LibraryStorage.deleteLibraryOuvrage).toHaveBeenCalledWith(brickWall.id)
    expect(store.ouvrages).toEqual([])
  })

  it('Should delete a constituent from storage and remove it from local state', async () => {
    const store = useLibraryStore()
    await store.upsertConstituent(brick)

    await store.removeConstituent(brick.id)

    expect(LibraryStorage.deleteLibraryConstituent).toHaveBeenCalledWith(brick.id)
    expect(store.constituents).toEqual([])
  })

  it('Should refuse to publish an ouvrage referencing a constituent not yet in the library', async () => {
    const store = useLibraryStore()
    // brick is NOT published to the library yet

    const result = await store.publishOuvrage(brickWall, [brick])

    expect(result).toEqual({ published: false, missing: [brick] })
    expect(store.ouvrages).toEqual([])
    expect(LibraryStorage.saveLibraryOuvrage).not.toHaveBeenCalled()
  })

  it('Should publish an ouvrage once all its referenced constituents are already in the library', async () => {
    const store = useLibraryStore()
    await store.upsertConstituent(brick)

    const result = await store.publishOuvrage(brickWall, [brick])

    expect(result).toEqual({ published: true })
    expect(store.ouvrages).toEqual([brickWall])
  })

  it('Should publish a standalone constituent unconditionally', async () => {
    const store = useLibraryStore()

    const result = await store.publishConstituent(brick)

    expect(result).toEqual({ published: true })
    expect(store.constituents).toEqual([brick])
  })
})
