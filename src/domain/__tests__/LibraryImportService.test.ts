import { describe, it, expect } from 'vitest'
import { planImportConstituent, planImportOuvrage, findUnpublishedConstituents } from '../services/LibraryImportService'
import type { Constituent } from '../models/Constituent'
import type { Ouvrage } from '../models/Ouvrage'

const brique: Constituent = {
  id: 'lib-c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const ciment: Constituent = {
  id: 'lib-c-2', name: 'Ciment', unit: 'sac 25kg', unitPrice: 5, category: 'Maçonnerie',
}
const murBrique: Ouvrage = {
  id: 'lib-o-1', name: 'Mur brique 1B', description: '', category: 'Maçonnerie',
  constituents: [
    { id: 'oc-1', constituentId: 'lib-c-1', position: 1, formula: 'L*H/(0.22*0.05)' },
    { id: 'oc-2', constituentId: 'lib-c-2', position: 2, formula: 'C1/300' },
  ],
}

describe('LibraryImportService — planImportConstituent', () => {
  it('copie le constituant bibliothèque quand il est absent localement', () => {
    const result = planImportConstituent([], brique)
    expect(result.alreadyPresent).toBe(false)
    expect(result.constituent).toEqual(brique)
  })

  it('réutilise la copie locale existante sans la modifier si déjà présente (même id)', () => {
    const localCopy: Constituent = { ...brique, unitPrice: 1.10 } // valeur locale divergée volontairement
    const result = planImportConstituent([localCopy], brique)
    expect(result.alreadyPresent).toBe(true)
    expect(result.constituent).toBe(localCopy)
    expect(result.constituent.unitPrice).toBe(1.10)
  })
})

describe('LibraryImportService — planImportOuvrage', () => {
  it("ne crée aucun nouveau constituant si tous les constituants référencés sont déjà présents localement", () => {
    const existingConstituents = [{ ...brique }, { ...ciment }]
    const libraryConstituentsById = new Map([[brique.id, brique], [ciment.id, ciment]])

    const result = planImportOuvrage(existingConstituents, murBrique, libraryConstituentsById)

    expect(result.newConstituents).toEqual([])
    expect(result.ouvrage).toEqual(murBrique)
  })

  it('importe en cascade les constituants référencés absents localement', () => {
    const libraryConstituentsById = new Map([[brique.id, brique], [ciment.id, ciment]])

    const result = planImportOuvrage([], murBrique, libraryConstituentsById)

    expect(result.newConstituents).toEqual([brique, ciment])
  })

  it('ignore les constituants déjà présents et ne copie que ceux manquants', () => {
    const existingConstituents = [{ ...brique }]
    const libraryConstituentsById = new Map([[brique.id, brique], [ciment.id, ciment]])

    const result = planImportOuvrage(existingConstituents, murBrique, libraryConstituentsById)

    expect(result.newConstituents).toEqual([ciment])
  })

  it("préserve le constituentId des OuvrageConstituent copiés (pas de remap, l'id est déjà partagé)", () => {
    const result = planImportOuvrage([], murBrique, new Map([[brique.id, brique], [ciment.id, ciment]]))

    expect(result.ouvrage.constituents.map(oc => oc.constituentId)).toEqual(['lib-c-1', 'lib-c-2'])
  })
})

describe('LibraryImportService — findUnpublishedConstituents', () => {
  const localBrique: Constituent = { ...brique, id: 'local-c-1' }
  const localCiment: Constituent = { ...ciment, id: 'local-c-2' }
  const localOuvrage: Ouvrage = {
    ...murBrique,
    id: 'local-o-1',
    constituents: [
      { id: 'oc-1', constituentId: 'local-c-1', position: 1, formula: 'L*H/(0.22*0.05)' },
      { id: 'oc-2', constituentId: 'local-c-2', position: 2, formula: 'C1/300' },
    ],
  }

  it("ne signale rien si tous les constituants référencés sont déjà publiés dans la bibliothèque", () => {
    const localConstituents = [localBrique, localCiment]
    const publishedIds = new Set(['local-c-1', 'local-c-2'])

    const result = findUnpublishedConstituents(localOuvrage, localConstituents, publishedIds)

    expect(result).toEqual([])
  })

  it("signale les constituants référencés qui ne sont pas encore publiés", () => {
    const localConstituents = [localBrique, localCiment]
    const publishedIds = new Set(['local-c-1']) // ciment pas encore publié

    const result = findUnpublishedConstituents(localOuvrage, localConstituents, publishedIds)

    expect(result).toEqual([localCiment])
  })
})
