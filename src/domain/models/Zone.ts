import type { Scale } from './Scale'
import type { Trace } from './Trace'

export interface ColorAssignment {
  id: string
  color: string
  ouvrageId: string
  epaisseur: number
  hauteur: number
  defaultAngle?: number
}

export interface Zone {
  id: string
  name: string
  scale: Scale | null
  backgroundImage: string | null
  colorAssignments: ColorAssignment[]
  traces: Trace[]
}
