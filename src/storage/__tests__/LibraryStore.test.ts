import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  saveLibraryOuvrage, loadLibraryOuvrage, listLibraryOuvrages, deleteLibraryOuvrage,
  saveLibraryConstituent, loadLibraryConstituent, listLibraryConstituents, deleteLibraryConstituent,
} from '../LibraryStore'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'

const brick: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const brickWall: Ouvrage = {
  id: 'o-1', name: 'Mur brique 1B', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L*H/(0.22*0.05)' }],
}

describe('LibraryStore — Ouvrage', () => {
  it('Should save and reload a library ouvrage unchanged', async () => {
    await saveLibraryOuvrage(brickWall)

    const loaded = await loadLibraryOuvrage('o-1')

    expect(loaded).toEqual(brickWall)
  })

  it('Should list saved library ouvrages and delete one by id', async () => {
    await saveLibraryOuvrage({ ...brickWall, id: 'o-2', name: 'Cloison' })
    await saveLibraryOuvrage({ ...brickWall, id: 'o-3', name: 'Dalle' })

    const before = await listLibraryOuvrages()
    expect(before.map(o => o.id)).toEqual(expect.arrayContaining(['o-2', 'o-3']))

    await deleteLibraryOuvrage('o-2')
    const after = await listLibraryOuvrages()
    expect(after.map(o => o.id)).not.toContain('o-2')
  })
})

describe('LibraryStore — Constituent', () => {
  it('Should save and reload a library constituent unchanged', async () => {
    await saveLibraryConstituent(brick)

    const loaded = await loadLibraryConstituent('c-1')

    expect(loaded).toEqual(brick)
  })

  it('Should list saved library constituents and delete one by id', async () => {
    await saveLibraryConstituent({ ...brick, id: 'c-2', name: 'Ciment' })
    await saveLibraryConstituent({ ...brick, id: 'c-3', name: 'Sable' })

    const before = await listLibraryConstituents()
    expect(before.map(c => c.id)).toEqual(expect.arrayContaining(['c-2', 'c-3']))

    await deleteLibraryConstituent('c-2')
    const after = await listLibraryConstituents()
    expect(after.map(c => c.id)).not.toContain('c-2')
  })
})
