export interface PrintConfig {
  title: boolean
  show2D: boolean
  show3D: boolean
  showRecapOuvrage: boolean
  showRecapConstituent: boolean
  showList: boolean
}

export function defaultPrintConfig(): PrintConfig {
  return {
    title: true,
    show2D: true,
    show3D: false,
    showRecapOuvrage: true,
    showRecapConstituent: true,
    showList: true,
  }
}
