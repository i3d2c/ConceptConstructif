export interface PrintConfig {
  title: boolean
  show2D: boolean
  show3D: boolean
  showRecapOuvrage: boolean
  showDevis: boolean
  showRecapConstituent: boolean
  showList: boolean
}

export function defaultPrintConfig(): PrintConfig {
  return {
    title: true,
    show2D: true,
    show3D: false,
    showRecapOuvrage: true,
    showDevis: true,
    showRecapConstituent: true,
    showList: true,
  }
}
