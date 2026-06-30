export interface OuvrageConstituent {
  id: string
  constituentId: string
  position: number
  formula: string
  formulaRecap?: string
}

export interface Ouvrage {
  id: string
  name: string
  description: string
  defaultEpaisseur?: number
  defaultHauteur?: number
  defaultLargeur?: number
  constituents: OuvrageConstituent[]
}
