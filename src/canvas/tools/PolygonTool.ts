import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'
import type { Scale } from '../../domain/models/Scale'

export type PolygonToolCallback = (points: [number, number][]) => void

export class PolygonTool {
  private canvas: CanvasManager
  private onDone: PolygonToolCallback
  private active = false
  private points: [number, number][] = []
  private preview: Konva.Line | null = null
  private dots: Konva.Circle[] = []
  private closeDot: Konva.Circle | null = null
  private distLabel: Konva.Label | null = null
  private color = '#ffffff'
  private scale: Scale | null = null
  private readonly CLOSE_RADIUS = 12

  private readonly escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.active) this.cancel()
  }

  constructor(canvas: CanvasManager, onDone: PolygonToolCallback) {
    this.canvas = canvas
    this.onDone = onDone
  }

  activate(color: string, scale: Scale | null = null) {
    this.active = true
    this.color = color
    this.scale = scale
    this.points = []
    this.canvas.stage.container().style.cursor = 'crosshair'
    this.canvas.stage.on('click.polygontool', (e) => this.onClick(e))
    this.canvas.stage.on('mousemove.polygontool', (e) => this.onMouseMove(e))
    window.addEventListener('keydown', this.escapeHandler)
  }

  deactivate() {
    this.active = false
    window.removeEventListener('keydown', this.escapeHandler)
    this.canvas.stage.off('.polygontool')
    this.canvas.stage.container().style.cursor = 'default'
    this.clearPreview()
  }

  cancel() {
    this.points = []
    this.clearPreview()
  }

  getLastPoint(): [number, number] | null {
    return this.points.length > 0 ? this.points[this.points.length - 1] : null
  }

  private clearPreview() {
    if (this.preview) { this.preview.destroy(); this.preview = null }
    if (this.closeDot) { this.closeDot.destroy(); this.closeDot = null }
    if (this.distLabel) { this.distLabel.destroy(); this.distLabel = null }
    this.dots.forEach(d => d.destroy())
    this.dots = []
    this.canvas.layers.tool.batchDraw()
  }

  private nearFirst(x: number, y: number): boolean {
    if (this.points.length < 3) return false
    const [fx, fy] = this.points[0]
    return Math.hypot(x - fx, y - fy) < this.CLOSE_RADIUS
  }

  private snappedPos(pos: { x: number, y: number }, ctrlKey: boolean): { x: number, y: number } {
    if (!ctrlKey || this.points.length === 0) return pos
    const last = this.points[this.points.length - 1]
    const dx = pos.x - last[0]
    const dy = pos.y - last[1]
    const angle = Math.atan2(dy, dx)
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
    const dist = Math.hypot(dx, dy)
    return {
      x: last[0] + dist * Math.cos(snapped),
      y: last[1] + dist * Math.sin(snapped),
    }
  }

  private formatDistance(px: number): string {
    if (this.scale) return (px * this.scale.ratio).toFixed(2).replace('.', ',') + ' m'
    return Math.round(px) + ' px'
  }

  private updateDistLabel(x: number, y: number) {
    if (this.points.length === 0) return
    const last = this.points[this.points.length - 1]
    const d = Math.hypot(x - last[0], y - last[1])
    const text = this.formatDistance(d)
    if (this.distLabel) {
      this.distLabel.position({ x: x + 14, y: y - 22 })
      ;(this.distLabel.getText() as Konva.Text).text(text)
    } else {
      this.distLabel = new Konva.Label({ x: x + 14, y: y - 22, listening: false })
      this.distLabel.add(new Konva.Tag({ fill: 'rgba(0,0,0,0.7)', cornerRadius: 3 }))
      this.distLabel.add(new Konva.Text({ text, fill: '#facc15', fontSize: 11, padding: 3 }))
      this.canvas.layers.tool.add(this.distLabel)
    }
  }

  private onClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.active) return
    const pos = this.canvas.stage.getPointerPosition()
    if (!pos) return
    const snapped = this.snappedPos(pos, e.evt.ctrlKey)

    if (this.nearFirst(snapped.x, snapped.y)) {
      this.close()
      return
    }

    this.points.push([snapped.x, snapped.y])
    const dot = new Konva.Circle({
      x: snapped.x, y: snapped.y, radius: 4,
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
    const snapped = this.snappedPos(pos, e.evt.ctrlKey)

    const near = this.nearFirst(snapped.x, snapped.y)

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

    const allPts = [...this.points.flat(), snapped.x, snapped.y]
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

    this.updateDistLabel(snapped.x, snapped.y)
    this.canvas.layers.tool.batchDraw()
  }

  private close() {
    if (this.points.length < 3) return
    const pts = [...this.points]
    this.deactivate()
    this.onDone(pts)
  }
}
