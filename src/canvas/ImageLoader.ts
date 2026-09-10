import Konva from 'konva'
import type { CanvasManager } from './CanvasManager'
import { useProjectStore } from '../stores/projectStore'
import { computeCenteredImageLayout, type ImageLayout } from '../domain/services/ImageLayoutCalculator'

export class ImageLoader {
  private canvas: CanvasManager
  private imageNode: Konva.Image | null = null

  constructor(canvas: CanvasManager) {
    this.canvas = canvas
  }

  load(dataUrl: string, persistedLayout: ImageLayout | null = null): Promise<ImageLayout> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const layout = persistedLayout ?? computeCenteredImageLayout(
          this.canvas.stage.width(), this.canvas.stage.height(), img.width, img.height,
        )

        if (this.imageNode) this.imageNode.destroy()

        this.imageNode = new Konva.Image({
          image: img,
          x: layout.x, y: layout.y, width: layout.w, height: layout.h,
          listening: false,
        })

        this.canvas.layers.background.destroyChildren()
        this.canvas.layers.background.add(this.imageNode)
        this.canvas.layers.background.batchDraw()

        useProjectStore().setBackgroundImageLayout(layout)
        resolve(layout)
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
