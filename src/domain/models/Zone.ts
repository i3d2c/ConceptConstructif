import type { Scale } from './Scale'
import type { Trace } from './Trace'
import type { PrintConfig } from '../../print/PrintConfig'

export interface ColorAssignment {
  id: string
  color: string
  ouvrageId: string
  epaisseur: number
  hauteur: number
}

export interface Zone {
  id: string
  name: string
  scale: Scale | null
  backgroundImage: string | null
  backgroundImageLayout: { x: number; y: number; w: number; h: number } | null
  colorAssignments: ColorAssignment[]
  traces: Trace[]
  printConfig: PrintConfig
}
