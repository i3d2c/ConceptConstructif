import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'

export type LineToolCallback = (points: [number, number][]) => void

export class LineTool {
  private canvas: CanvasManager
  private onDone: LineToolCallback
  private active = false
  private points: [number, number][] = []
  private preview: Konva.Line | null = null
  private dots: Konva.Circle[] = []
  private color = '#ffffff'
  private strokeWidth = 4

  constructor(canvas: CanvasManager, onDone: LineToolCallback) {
    this.canvas = canvas
    this.onDone = onDone
  }

  activate(color: string, strokeWidth: number) {
    this.active = true
    this.color = color
    this.strokeWidth = strokeWidth
    this.points = []
    this.canvas.stage.container().style.cursor = 'crosshair'
    this.canvas.stage.on('click.linetool', (e) => this.onClick(e))
    this.canvas.stage.on('mousemove.linetool', (e) => this.onMouseMove(e))
    this.canvas.stage.on('dblclick.linetool', () => this.finish())
  }

  deactivate() {
    this.active = false
    this.canvas.stage.off('.linetool')
    this.canvas.stage.container().style.cursor = 'default'
    this.clearPreview()
  }

  private clearPreview() {
    if (this.preview) { this.preview.destroy(); this.preview = null }
    this.dots.forEach(d => d.destroy())
    this.dots = []
    this.canvas.layers.tool.batchDraw()
  }

  private onClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active) return
    if (e.evt.detail === 2) return // double-click handled by dblclick
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return
    this.points.push([pos.x, pos.y])

    const dot = new Konva.Circle({
      x: pos.x, y: pos.y, radius: 4,
      fill: this.color, listening: false,
    })
    this.canvas.layers.tool.add(dot)
    this.dots.push(dot)
    this.canvas.layers.tool.batchDraw()
  }

  private onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active || this.points.length === 0) return
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return

    const last = this.points[this.points.length - 1]
    const allPoints = [...this.points.flat(), pos.x, pos.y]

    if (this.preview) {
      this.preview.points(allPoints)
    } else {
      this.preview = new Konva.Line({
        points: allPoints,
        stroke: this.color,
        strokeWidth: this.strokeWidth,
        opacity: 0.7,
        listening: false,
      })
      this.canvas.layers.tool.add(this.preview)
    }
    this.canvas.layers.tool.batchDraw()
    void last
    void e
  }

  private finish() {
    if (!this.active || this.points.length < 2) return
    const pts = [...this.points]
    this.deactivate()
    this.onDone(pts)
  }
}
