import Konva from 'konva'
import type { CanvasManager } from './CanvasManager'

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

        this.imageNode = new Konva.Image({
          image: img,
          x: (stageW - w) / 2,
          y: (stageH - h) / 2,
          width: w,
          height: h,
          listening: false,
        })

        this.canvas.layers.background.destroyChildren()
        this.canvas.layers.background.add(this.imageNode)
        this.canvas.layers.background.batchDraw()
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
  }
}
