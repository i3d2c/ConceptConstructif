import type { Ouvrage } from './Ouvrage'
import type { Constituent } from './Constituent'
import type { Zone } from './Zone'

export interface ZoneGroup {
  id: string
  name: string
  zoneIds: string[]
}

export interface Project {
  id: string
  name: string
  ouvrages: Ouvrage[]
  constituents: Constituent[]
  zones: Zone[]
  zoneGroups: ZoneGroup[]
  activeZoneId: string
  createdAt: string
  updatedAt: string
}
