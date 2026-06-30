import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'
import type { Trace } from '../../domain/models/Trace'
import type { ColorAssignment } from '../../domain/models/Zone'

function centroid(points: [number, number][]): [number, number] {
  const x = points.reduce((s, p) => s + p[0], 0) / points.length
  const y = points.reduce((s, p) => s + p[1], 0) / points.length
  return [x, y]
}

// For a LineTrace: midpoint of the middle segment
function lineMiddle(points: [number, number][]): [number, number] {
  if (points.length < 2) return centroid(points)
  const segCount = points.length - 1
  const midSeg = Math.floor((segCount - 1) / 2)
  const p1 = points[midSeg]
  const p2 = points[midSeg + 1]
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
}

export class NumberRenderer {
  private canvas: CanvasManager

  constructor(canvas: CanvasManager) {
    this.canvas = canvas
  }

  renderAll(traces: Trace[], colorAssignments: ColorAssignment[]) {
    const layer = this.canvas.layers.numbers
    layer.destroyChildren()

    for (const trace of traces) {
      const ca = colorAssignments.find(c => c.id === trace.colorAssignmentId)
      if (!ca) continue

      const [cx, cy] = trace.type === 'line'
        ? lineMiddle(trace.points)
        : centroid(trace.points)

      const radius = 12

      layer.add(new Konva.Circle({
        x: cx, y: cy, radius,
        fill: ca.color,
        listening: false,
      }))

      layer.add(new Konva.Text({
        x: cx - radius, y: cy - radius,
        width: radius * 2, height: radius * 2,
        text: String(trace.number),
        fill: '#ffffff',
        fontSize: 11,
        fontStyle: 'bold',
        align: 'center',
        verticalAlign: 'middle',
        listening: false,
      }))
    }

    layer.batchDraw()
  }
}
