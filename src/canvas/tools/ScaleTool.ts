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

  private snappedPos(pos: { x: number; y: number }, ctrlKey: boolean): { x: number; y: number } {
    if (!ctrlKey || !this.p1) return pos
    const dx = pos.x - this.p1[0]
    const dy = pos.y - this.p1[1]
    const angle = Math.atan2(dy, dx)
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
    const dist = Math.hypot(dx, dy)
    return { x: this.p1[0] + dist * Math.cos(snapped), y: this.p1[1] + dist * Math.sin(snapped) }
  }

  private onClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active) return
    const raw = this.canvas.stage.getPointerPosition()
    if (!raw) return
    const pos = this.snappedPos(raw, e.evt.ctrlKey)

    if (!this.p1) {
      this.p1 = [pos.x, pos.y]
    } else {
      const p2: [number, number] = [pos.x, pos.y]
      this.deactivate()
      this.onDone(this.p1, p2)
    }
  }

  private onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active || !this.p1) return
    const raw = this.canvas.stage.getPointerPosition()
    if (!raw) return
    const pos = this.snappedPos(raw, e.evt.ctrlKey)

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
