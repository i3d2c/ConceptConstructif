import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'

export type ScaleToolCallback = (p1: [number, number], p2: [number, number]) => void

export class ScaleTool {
  private canvas: CanvasManager
  private onDone: ScaleToolCallback
  private active = false
  private p1: [number, number] | null = null
  private preview: Konva.Line | null = null

  constructor(canvas: CanvasManager, onDone: ScaleToolCallback) {
    this.canvas = canvas
    this.onDone = onDone
  }

  activate() {
    this.active = true
    this.p1 = null
    this.canvas.stage.container().style.cursor = 'crosshair'
    this.canvas.stage.on('click.scaletool', (e) => this.onClick(e))
    this.canvas.stage.on('mousemove.scaletool', (e) => this.onMouseMove(e))
  }

  deactivate() {
    this.active = false
    this.canvas.stage.off('.scaletool')
    this.canvas.stage.container().style.cursor = 'default'
    if (this.preview) {
      this.preview.destroy()
      this.preview = null
      this.canvas.layers.tool.batchDraw()
    }
  }

  private onClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active) return
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return

    if (!this.p1) {
      this.p1 = [pos.x, pos.y]
    } else {
      const p2: [number, number] = [pos.x, pos.y]
      this.deactivate()
      this.onDone(this.p1, p2)
      void e
    }
  }

  private onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active || !this.p1) return
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return

    if (this.preview) {
      this.preview.points([this.p1[0], this.p1[1], pos.x, pos.y])
    } else {
      this.preview = new Konva.Line({
        points: [this.p1[0], this.p1[1], pos.x, pos.y],
        stroke: '#ffffff',
        strokeWidth: 2,
        dash: [6, 3],
        listening: false,
      })
      this.canvas.layers.tool.add(this.preview)
    }
    this.canvas.layers.tool.batchDraw()
    void e
  }
}
