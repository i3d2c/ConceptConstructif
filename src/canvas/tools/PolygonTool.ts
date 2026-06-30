import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'

export type PolygonToolCallback = (points: [number, number][]) => void

export class PolygonTool {
  private canvas: CanvasManager
  private onDone: PolygonToolCallback
  private active = false
  private points: [number, number][] = []
  private preview: Konva.Line | null = null
  private dots: Konva.Circle[] = []
  private closeDot: Konva.Circle | null = null
  private color = '#ffffff'
  private readonly CLOSE_RADIUS = 12

  constructor(canvas: CanvasManager, onDone: PolygonToolCallback) {
    this.canvas = canvas
    this.onDone = onDone
  }

  activate(color: string) {
    this.active = true
    this.color = color
    this.points = []
    this.canvas.stage.container().style.cursor = 'crosshair'
    this.canvas.stage.on('click.polygontool', (e) => this.onClick(e))
    this.canvas.stage.on('mousemove.polygontool', (e) => this.onMouseMove(e))
  }

  deactivate() {
    this.active = false
    this.canvas.stage.off('.polygontool')
    this.canvas.stage.container().style.cursor = 'default'
    this.clearPreview()
  }

  private clearPreview() {
    if (this.preview) { this.preview.destroy(); this.preview = null }
    if (this.closeDot) { this.closeDot.destroy(); this.closeDot = null }
    this.dots.forEach(d => d.destroy())
    this.dots = []
    this.canvas.layers.tool.batchDraw()
  }

  private nearFirst(x: number, y: number): boolean {
    if (this.points.length < 3) return false
    const [fx, fy] = this.points[0]
    return Math.hypot(x - fx, y - fy) < this.CLOSE_RADIUS
  }

  private onClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active) return
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return

    if (this.nearFirst(pos.x, pos.y)) {
      this.close()
      return
    }

    this.points.push([pos.x, pos.y])
    const dot = new Konva.Circle({
      x: pos.x, y: pos.y, radius: 4,
      fill: this.color, listening: false,
    })
    this.canvas.layers.tool.add(dot)
    this.dots.push(dot)
    this.canvas.layers.tool.batchDraw()
    void e
  }

  private onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active || this.points.length === 0) return
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return

    const near = this.nearFirst(pos.x, pos.y)

    if (!this.closeDot && this.points.length >= 3) {
      this.closeDot = new Konva.Circle({
        x: this.points[0][0], y: this.points[0][1],
        radius: this.CLOSE_RADIUS,
        stroke: '#ffffff', strokeWidth: 2,
        fill: 'transparent', listening: false,
      })
      this.canvas.layers.tool.add(this.closeDot)
    }
    if (this.closeDot) {
      this.closeDot.fill(near ? 'rgba(255,255,255,0.3)' : 'transparent')
    }

    const allPts = [...this.points.flat(), pos.x, pos.y]
    if (this.preview) {
      this.preview.points(allPts)
    } else {
      this.preview = new Konva.Line({
        points: allPts,
        stroke: this.color,
        strokeWidth: 2,
        opacity: 0.7,
        closed: false,
        listening: false,
      })
      this.canvas.layers.tool.add(this.preview)
    }
    this.canvas.layers.tool.batchDraw()
    void e
  }

  private close() {
    if (this.points.length < 3) return
    const pts = [...this.points]
    this.deactivate()
    this.onDone(pts)
  }
}
