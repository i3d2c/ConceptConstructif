import Konva from 'konva'
import type { CanvasManager } from './CanvasManager'
import { useProjectStore } from '../stores/projectStore'

export class ImageLoader {
  private canvas: CanvasManager
  private imageNode: Konva.Image | null = null

  constructor(canvas: CanvasManager) {
    this.canvas = canvas
  }

  load(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const stageW = this.canvas.stage.width()
        const stageH = this.canvas.stage.height()

        const maxW = stageW * 0.9
        const maxH = stageH * 0.9
        const scale = Math.min(maxW / img.width, maxH / img.height)
        const w = img.width * scale
        const h = img.height * scale

        if (this.imageNode) this.imageNode.destroy()

        const x = (stageW - w) / 2
        const y = (stageH - h) / 2

        this.imageNode = new Konva.Image({
          image: img,
          x, y, width: w, height: h,
          listening: false,
        })

        this.canvas.layers.background.destroyChildren()
        this.canvas.layers.background.add(this.imageNode)
        this.canvas.layers.background.batchDraw()

        useProjectStore().setBackgroundImageLayout({ x, y, w, h })
        resolve()
      }
      img.onerror = reject
      img.src = dataUrl
    })
  }

  clear() {
    this.canvas.layers.background.destroyChildren()
    this.imageNode = null
    this.canvas.layers.background.batchDraw()
    useProjectStore().setBackgroundImageLayout(null)
  }
}
