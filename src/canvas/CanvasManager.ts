import Konva from 'konva'
import { computeFramedView } from './computeFramedView'

export class CanvasManager {
  stage: Konva.Stage
  layers: {
    background: Konva.Layer
    scale: Konva.Layer
    traces: Konva.Layer
    tool: Konva.Layer
    numbers: Konva.Layer
  }

  constructor(containerId: string, width: number, height: number) {
    this.stage = new Konva.Stage({ container: containerId, width, height })

    this.layers = {
      background: new Konva.Layer(),
      scale: new Konva.Layer(),
      traces: new Konva.Layer(),
      tool: new Konva.Layer(),
      numbers: new Konva.Layer(),
    }

    this.stage.add(this.layers.background)
    this.stage.add(this.layers.scale)
    this.stage.add(this.layers.traces)
    this.stage.add(this.layers.tool)
    this.stage.add(this.layers.numbers)
  }

  resize(width: number, height: number) {
    this.stage.width(width)
    this.stage.height(height)
  }

  toDataURL(): Promise<string> {
    return new Promise(resolve => {
      this.stage.toDataURL({ callback: resolve })
    })
  }

  // Temporarily reframes the stage to fit the given points before capturing, then restores the live view.
  captureFramed(points: [number, number][]): Promise<string> {
    const originalScale = this.stage.scale()
    const originalPosition = this.stage.position()
    const framing = computeFramedView(points, this.stage.width(), this.stage.height())

    if (framing) {
      this.stage.scale({ x: framing.scale, y: framing.scale })
      this.stage.position({ x: framing.x, y: framing.y })
      this.stage.batchDraw()
    }

    return new Promise(resolve => {
      this.stage.toDataURL({
        callback: dataUrl => {
          if (framing) {
            this.stage.scale(originalScale)
            this.stage.position(originalPosition)
            this.stage.batchDraw()
          }
          resolve(dataUrl)
        },
      })
    })
  }

  destroy() {
    this.stage.destroy()
  }
}
