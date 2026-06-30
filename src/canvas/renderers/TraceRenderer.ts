import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'
import type { Trace } from '../../domain/models/Trace'
import type { ColorAssignment } from '../../domain/models/Zone'
import type { Scale } from '../../domain/models/Scale'

export class TraceRenderer {
  private canvas: CanvasManager
  private nodes = new Map<string, Konva.Node>()

  constructor(canvas: CanvasManager) {
    this.canvas = canvas
  }

  renderAll(traces: Trace[], colorAssignments: ColorAssignment[], scale: Scale | null) {
    const layer = this.canvas.layers.traces
    layer.destroyChildren()
    this.nodes.clear()

    for (const trace of traces) {
      const ca = colorAssignments.find(c => c.id === trace.colorAssignmentId)
      if (!ca) continue
      this.renderOne(trace, ca, scale)
    }
    layer.batchDraw()
  }

  private renderOne(trace: Trace, ca: ColorAssignment, scale: Scale | null) {
    const layer = this.canvas.layers.traces
    const pts = trace.points.flat()

    if (trace.type === 'line') {
      const strokeWidth = scale ? ca.epaisseur / scale.ratio : 4
      const node = new Konva.Line({
        id: trace.id,
        points: pts,
        stroke: ca.color,
        strokeWidth: Math.max(strokeWidth, 1),
        lineCap: 'round',
        lineJoin: 'round',
        listening: true,
      })
      layer.add(node)
      this.nodes.set(trace.id, node)
    } else {
      const node = new Konva.Line({
        id: trace.id,
        points: pts,
        fill: ca.color + '88',
        stroke: ca.color,
        strokeWidth: 2,
        closed: true,
        listening: true,
      })
      layer.add(node)
      this.nodes.set(trace.id, node)
    }
  }

  highlight(traceId: string, on: boolean) {
    const node = this.nodes.get(traceId)
    if (!node) return
    if (on) {
      node.shadowColor('#ffffff')
      node.shadowBlur(10)
    } else {
      node.shadowBlur(0)
    }
    this.canvas.layers.traces.batchDraw()
  }
}
