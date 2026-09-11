import { Scene3D } from './Scene3D'
import type { Zone } from '../domain/models/Zone'

interface StoreRef {
  activeZone: Zone | undefined
  bgLayout: { x: number; y: number; w: number; h: number } | null
}

const SNAPSHOT_WIDTH = 1600
const SNAPSHOT_HEIGHT = 1200

function waitForRender(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export async function capturePrintSnapshot(store: StoreRef): Promise<string | null> {
  if (!store.activeZone?.scale) return null

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = `${SNAPSHOT_WIDTH}px`
  container.style.height = `${SNAPSHOT_HEIGHT}px`
  document.body.appendChild(container)

  const scene3d = new Scene3D(container, store)
  scene3d.rebuild()
  await waitForRender()
  const dataUrl = scene3d.getDataURL()

  scene3d.destroy()
  container.remove()

  return dataUrl
}
