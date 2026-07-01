import Konva from 'konva'
import type { Scale } from '../../domain/models/Scale'
import type { CanvasManager } from '../CanvasManager'

export class ScaleRenderer {
  private canvas: CanvasManager

  constructor(canvas: CanvasManager) {
    this.canvas = canvas
  }

  render(scale: Scale) {
    const layer = this.canvas.layers.scale
    layer.destroyChildren()

    const [[x1, y1], [x2, y2]] = scale.tracePoints
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2

    // Main line
    layer.add(new Konva.Line({
      points: [x1, y1, x2, y2],
      stroke: '#facc15',
      strokeWidth: 2,
      listening: false,
    }))

    // Arrow caps
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const arrowLen = 10
    for (const [px, py, dir] of [[x1, y1, angle], [x2, y2, angle + Math.PI]] as [number, number, number][]) {
      layer.add(new Konva.Line({
        points: [
          px, py,
          px + arrowLen * Math.cos(dir + 0.4), py + arrowLen * Math.sin(dir + 0.4),
          px, py,
          px + arrowLen * Math.cos(dir - 0.4), py + arrowLen * Math.sin(dir - 0.4),
        ],
        stroke: '#facc15',
        strokeWidth: 2,
        listening: false,
      }))
    }

    // Label
    const label = `${scale.realLength.toFixed(2).replace('.', ',')} m`
    layer.add(new Konva.Label({ x: cx, y: cy - 14, listening: false })
      .add(new Konva.Tag({ fill: 'rgba(0,0,0,0.6)', cornerRadius: 3 }))
      .add(new Konva.Text({ text: label, fill: '#facc15', fontSize: 12, padding: 4, fontStyle: 'bold' })))

    layer.batchDraw()
  }

  clear() {
    this.canvas.layers.scale.destroyChildren()
    this.canvas.layers.scale.batchDraw()
  }
}
