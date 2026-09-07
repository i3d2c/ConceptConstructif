import type { Ouvrage } from '../models/Ouvrage'

export function duplicateOuvrage(ouvrage: Ouvrage, newId: string, newName?: string): Ouvrage {
  const clone: Ouvrage = JSON.parse(JSON.stringify(ouvrage))
  clone.id = newId
  clone.name = newName ?? `${ouvrage.name} (copie)`
  clone.constituents = clone.constituents.map(oc => ({ ...oc, id: crypto.randomUUID() }))
  return clone
}
