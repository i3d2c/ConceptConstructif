import type { Zone } from '../models/Zone'

export function duplicateZone(zone: Zone, newId: string, newName?: string): Zone {
  return {
    ...JSON.parse(JSON.stringify(zone)),
    id: newId,
    name: newName ?? `${zone.name} (copie)`,
  }
}
