export interface OuvrageConstituent {
  id: string
  constituentId: string
  position: number
  formula: string
  disabled?: boolean
  hideIfZero?: boolean
  hideIfPriceZero?: boolean
  hideFromRecapOuvrage?: boolean
  hideFromRecapConstituent?: boolean
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
