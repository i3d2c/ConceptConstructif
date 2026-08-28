import type { Constituent } from '../models/Constituent'
import type { Ouvrage } from '../models/Ouvrage'

export interface ImportConstituentResult {
  constituent: Constituent
  alreadyPresent: boolean
}

export function planImportConstituent(
  existingConstituents: Constituent[],
  libraryConstituent: Constituent,
): ImportConstituentResult {
  const existing = existingConstituents.find(c => c.id === libraryConstituent.id)
  if (existing) return { constituent: existing, alreadyPresent: true }
  return { constituent: { ...libraryConstituent }, alreadyPresent: false }
}

export interface ImportOuvrageResult {
  ouvrage: Ouvrage
  newConstituents: Constituent[]
}

export function planImportOuvrage(
  existingConstituents: Constituent[],
  libraryOuvrage: Ouvrage,
  libraryConstituentsById: Map<string, Constituent>,
): ImportOuvrageResult {
  const knownIds = new Set(existingConstituents.map(c => c.id))
  const newConstituents: Constituent[] = []

  for (const oc of libraryOuvrage.constituents) {
    if (knownIds.has(oc.constituentId)) continue
    const libraryConstituent = libraryConstituentsById.get(oc.constituentId)
    if (!libraryConstituent) continue
    newConstituents.push({ ...libraryConstituent })
    knownIds.add(libraryConstituent.id)
  }

  return { ouvrage: { ...libraryOuvrage }, newConstituents }
}

export function findUnpublishedConstituents(
  ouvrage: Ouvrage,
  localConstituents: Constituent[],
  publishedConstituentIds: Set<string>,
): Constituent[] {
  const byId = new Map(localConstituents.map(c => [c.id, c]))
  const unpublished: Constituent[] = []
  const seen = new Set<string>()

  for (const oc of ouvrage.constituents) {
    if (publishedConstituentIds.has(oc.constituentId) || seen.has(oc.constituentId)) continue
    const constituent = byId.get(oc.constituentId)
    if (!constituent) continue
    unpublished.push(constituent)
    seen.add(oc.constituentId)
  }

  return unpublished
}
