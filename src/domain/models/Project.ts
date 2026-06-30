import type { Ouvrage } from './Ouvrage'
import type { Constituent } from './Constituent'
import type { Zone } from './Zone'

export interface Project {
  id: string
  name: string
  ouvrages: Ouvrage[]
  constituents: Constituent[]
  zones: Zone[]
  activeZoneId: string
  createdAt: string
  updatedAt: string
}
