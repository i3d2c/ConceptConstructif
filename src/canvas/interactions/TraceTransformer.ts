import Konva from 'konva'
import type { CanvasManager } from '../CanvasManager'
import type { Trace } from '../../domain/models/Trace'

export type TransformCallback = (traceId: string, newPoints: [number, number][]) => void
export type SelectCallback = (traceId: string | null) => void

export class TraceTransformer {
  private canvas: CanvasManager
  private onTransform: TransformCallback
  private onSelect: SelectCallback
  private active = false
  private selected: string | null = null
  private clipboard: Trace | null = null

  constructor(canvas: CanvasManager, onTransform: TransformCallback, onSelect: SelectCallback) {
    this.canvas = canvas
    this.onTransform = onTransform
    this.onSelect = onSelect
  }

  activate(traces: Trace[]) {
    this.active = true
    this.canvas.stage.container().style.cursor = 'default'

    this.canvas.layers.traces.on('click.transformer', (e) => {
      const node = e.target
      const traceId = node.id()
      if (traceId) {
        this.selected = traceId
        this.onSelect(traceId)
      }
    })

    this.canvas.stage.on('click.transformer-deselect', (e) => {
      if (e.target === this.canvas.stage) {
        this.selected = null
        this.onSelect(null)
      }
    })

    void traces
  }

  deactivate() {
    this.active = false
    this.canvas.layers.traces.off('.transformer')
    this.canvas.stage.off('.transformer-deselect')
    this.selected = null
  }

  copy(traces: Trace[]) {
    if (!this.selected) return
    const t = traces.find(t => t.id === this.selected)
    if (t) this.clipboard = JSON.parse(JSON.stringify(t)) as Trace
  }

  paste(): Trace | null {
    if (!this.clipboard) return null
    return JSON.parse(JSON.stringify(this.clipboard)) as Trace
  }
}
