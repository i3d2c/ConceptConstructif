<script setup lang="ts">
import Konva from 'konva'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { CanvasManager } from '../canvas/CanvasManager'
import { ImageLoader } from '../canvas/ImageLoader'
import { ScaleTool } from '../canvas/tools/ScaleTool'
import { LineTool } from '../canvas/tools/LineTool'
import { PolygonTool } from '../canvas/tools/PolygonTool'
import { ScaleRenderer } from '../canvas/renderers/ScaleRenderer'
import { TraceRenderer } from '../canvas/renderers/TraceRenderer'
import { NumberRenderer } from '../canvas/renderers/NumberRenderer'
import { buildScale } from '../domain/services/ScaleCalculator'
import { computeTraceVariables } from '../domain/services/ChiffrageCalculator'
import type { LineTrace, SurfaceTrace, Trace } from '../domain/models/Trace'
import ScaleDialog from './dialogs/ScaleDialog.vue'
import TraceInfoDialog from './dialogs/TraceInfoDialog.vue'

const store = useProjectStore()
const containerRef = ref<HTMLDivElement | null>(null)

let cm: CanvasManager | null = null
let imageLoader: ImageLoader | null = null
let scaleTool: ScaleTool | null = null
let lineTool: LineTool | null = null
let polygonTool: PolygonTool | null = null
let scaleRenderer: ScaleRenderer | null = null
let traceRenderer: TraceRenderer | null = null
let numberRenderer: NumberRenderer | null = null

const showScaleDialog = ref(false)
const pendingScalePoints = ref<[[number, number], [number, number]] | null>(null)
const infoTrace = ref<Trace | null>(null)

// Hover tooltip
const hoverTraceId = ref<string | null>(null)
const hoverPos = ref({ x: 0, y: 0 })
const hoverInfo = computed(() => {
  if (!hoverTraceId.value || !store.activeZone) return null
  const trace = store.activeZone.traces.find(t => t.id === hoverTraceId.value)
  const ca = store.activeZone.colorAssignments.find(c => c.id === trace?.colorAssignmentId)
  if (!trace || !ca) return null
  if (!store.activeZone.scale) {
    return `#${trace.number} — ${trace.type === 'line' ? 'Trait' : 'Surface'}`
  }
  const angleDeg = trace.type === 'surface' ? (trace.angle ?? 0) : 0
  const v = computeTraceVariables(trace.type, trace.points, store.activeZone.scale, ca, angleDeg)
  if (trace.type === 'line') {
    return `#${trace.number}  L=${v.L.toFixed(2)}m  H=${v.H.toFixed(2)}m  E=${v.E.toFixed(3)}m`
  } else {
    return `#${trace.number}  S=${v.S.toFixed(2)}m²  L=${v.L.toFixed(2)}m  H=${v.H.toFixed(2)}m`
  }
})

// ── Select mode drag state ─────────────────────────────────────────────────
type DragState = {
  type: 'vertex' | 'trace'
  traceId: string
  vertexIdx: number   // -1 for trace drag
  startMouseX: number
  startMouseY: number
  startPoints: [number, number][]
  isCtrl: boolean
}
let dragState: DragState | null = null
let isDragging = false

// Vertex handle IDs: "vh_${traceId}_${idx}"
// (underscore separators avoid CSS selector issues with UUID dashes)
function makeHandleId(traceId: string, idx: number) { return `vh_${traceId}_${idx}` }
function parseHandleId(id: string): { traceId: string; idx: number } | null {
  if (!id.startsWith('vh_')) return null
  const rest = id.slice(3)                        // "uuid_0"
  const cut = rest.lastIndexOf('_')
  if (cut === -1) return null
  return { traceId: rest.slice(0, cut), idx: parseInt(rest.slice(cut + 1)) }
}

function getHandle(traceId: string, idx: number): Konva.Circle | undefined {
  return cm?.layers.tool.getChildren()
    .find(n => n.id() === makeHandleId(traceId, idx)) as Konva.Circle | undefined
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getSelectedCa() {
  if (!store.selectedCaId || !store.activeZone) return null
  return store.activeZone.colorAssignments.find(c => c.id === store.selectedCaId) ?? null
}

function nextTraceNumber(): number {
  return (store.activeZone?.traces.reduce((m, t) => Math.max(m, t.number), 0) ?? 0) + 1
}

function rerenderAll() {
  if (isDragging) return
  const zone = store.activeZone
  if (!cm || !zone) return
  traceRenderer?.renderAll(zone.traces, zone.colorAssignments, zone.scale)
  numberRenderer?.renderAll(zone.traces, zone.colorAssignments)
  if (zone.scale) scaleRenderer?.render(zone.scale)
  else scaleRenderer?.clear()
  if (store.drawMode === 'select') renderSelectHandles()
}

// ── Select handles ─────────────────────────────────────────────────────────
function renderSelectHandles() {
  if (!cm || !store.activeZone) return
  const zone = store.activeZone
  cm.layers.tool.destroyChildren()

  for (const trace of zone.traces) {
    const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
    for (let i = 0; i < trace.points.length; i++) {
      const [px, py] = trace.points[i]
      const handle = new Konva.Circle({
        id: makeHandleId(trace.id, i),
        x: px, y: py,
        radius: 5,
        fill: '#ffffff',
        stroke: ca?.color ?? '#888',
        strokeWidth: 2,
        hitStrokeWidth: 14,
        listening: true,
      })
      handle.on('mouseover', () => { if (!isDragging) cm!.stage.container().style.cursor = 'grab' })
      handle.on('mouseout', () => { if (!isDragging) cm!.stage.container().style.cursor = 'default' })
      cm.layers.tool.add(handle)
    }
  }
  cm.layers.tool.batchDraw()
}

// ── Tool activation ────────────────────────────────────────────────────────
function deactivateSelectHandlers() {
  cm?.layers.traces.off('.select')
  cm?.stage.off('.select')
  cm?.stage.off('.selectdrag')
  cm?.layers.tool.destroyChildren()
  cm?.layers.tool.batchDraw()
  hoverTraceId.value = null
  dragState = null
  isDragging = false
}

function activateTool(mode: string) {
  scaleTool?.deactivate()
  lineTool?.deactivate()
  polygonTool?.deactivate()
  deactivateSelectHandlers()

  const zone = store.activeZone
  if (!zone || !cm) return

  if (mode === 'scale') {
    scaleTool?.activate()
  } else if (mode === 'line') {
    const ca = getSelectedCa()
    if (!ca) return
    const strokeWidth = zone.scale ? ca.epaisseur / zone.scale.ratio : 2
    lineTool?.activate(ca.color, Math.max(strokeWidth, 1), zone.scale)
  } else if (mode === 'surface') {
    const ca = getSelectedCa()
    if (!ca) return
    polygonTool?.activate(ca.color, zone.scale)
  } else if (mode === 'select') {
    renderSelectHandles()

    // Hover highlight on traces
    cm.layers.traces.on('mouseover.select', (e) => {
      if (isDragging) return
      const id = e.target.id()
      if (!id) return
      hoverTraceId.value = id
      traceRenderer?.highlight(id, true)
      cm!.stage.container().style.cursor = 'move'
    })
    cm.layers.traces.on('mouseout.select', (e) => {
      if (isDragging) return
      const id = e.target.id()
      traceRenderer?.highlight(id, false)
      hoverTraceId.value = null
      cm!.stage.container().style.cursor = 'default'
    })
    cm.stage.on('mousemove.select', () => {
      if (!hoverTraceId.value || isDragging) return
      const pos = cm!.stage.getPointerPosition()
      if (pos) hoverPos.value = { x: pos.x + 14, y: pos.y - 30 }
    })

    // Drag (vertex or trace)
    cm.stage.on('mousedown.selectdrag', (e) => {
      const target = e.target
      const id = target.id()
      const pos = cm!.stage.getPointerPosition()
      if (!pos || !store.activeZone) return

      const parsed = parseHandleId(id)
      if (parsed) {
        // Vertex handle
        const trace = store.activeZone.traces.find(t => t.id === parsed.traceId)
        if (!trace) return
        dragState = {
          type: 'vertex', traceId: parsed.traceId, vertexIdx: parsed.idx,
          startMouseX: pos.x, startMouseY: pos.y,
          startPoints: trace.points.map(p => [p[0], p[1]] as [number, number]),
          isCtrl: false,
        }
        cm!.stage.container().style.cursor = 'grabbing'
      } else if (store.activeZone.traces.some(t => t.id === id)) {
        // Trace body
        const trace = store.activeZone.traces.find(t => t.id === id)!
        dragState = {
          type: 'trace', traceId: id, vertexIdx: -1,
          startMouseX: pos.x, startMouseY: pos.y,
          startPoints: trace.points.map(p => [p[0], p[1]] as [number, number]),
          isCtrl: e.evt.ctrlKey,
        }
        cm!.stage.container().style.cursor = e.evt.ctrlKey ? 'copy' : 'grabbing'
      }
    })

    cm.stage.on('mousemove.selectdrag', () => {
      if (!dragState) return
      isDragging = true
      const pos = cm!.stage.getPointerPosition()
      if (!pos) return

      const dx = pos.x - dragState.startMouseX
      const dy = pos.y - dragState.startMouseY

      if (dragState.type === 'vertex') {
        const newPts = dragState.startPoints.map((p, i) =>
          i === dragState!.vertexIdx ? [p[0] + dx, p[1] + dy] as [number, number] : p
        )
        // Move Konva line node directly
        const lineNode = cm!.layers.traces.findOne<Konva.Line>('#' + dragState.traceId)
        lineNode?.points(newPts.flat())
        cm!.layers.traces.batchDraw()
        // Move handle
        const handle = getHandle(dragState.traceId, dragState.vertexIdx)
        handle?.position({ x: newPts[dragState.vertexIdx][0], y: newPts[dragState.vertexIdx][1] })
        cm!.layers.tool.batchDraw()
      } else {
        const newPts = dragState.startPoints.map(p => [p[0] + dx, p[1] + dy] as [number, number])
        const lineNode = cm!.layers.traces.findOne<Konva.Line>('#' + dragState.traceId)
        lineNode?.points(newPts.flat())
        cm!.layers.traces.batchDraw()
        // Move all handles
        for (let i = 0; i < dragState.startPoints.length; i++) {
          getHandle(dragState.traceId, i)?.position({ x: newPts[i][0], y: newPts[i][1] })
        }
        cm!.layers.tool.batchDraw()
      }
    })

    cm.stage.on('mouseup.selectdrag', (e) => {
      if (!dragState) return
      const pos = cm!.stage.getPointerPosition()
      const wasDrag = isDragging
      // Reset before store update so rerenderAll is not blocked
      const ds = dragState
      dragState = null
      isDragging = false
      cm!.stage.container().style.cursor = 'default'

      if (!pos || !store.activeZone) return
      const dx = pos.x - ds.startMouseX
      const dy = pos.y - ds.startMouseY
      const moved = wasDrag && Math.hypot(dx, dy) > 4
      const zone = store.activeZone

      if (moved) {
        const newPts = ds.startPoints.map((p, i) =>
          ds.type === 'vertex' && i === ds.vertexIdx
            ? [p[0] + dx, p[1] + dy] as [number, number]
            : ds.type === 'trace' ? [p[0] + dx, p[1] + dy] as [number, number]
            : p
        )
        if (ds.isCtrl && ds.type === 'trace') {
          // Duplicate
          const orig = zone.traces.find(t => t.id === ds.traceId)
          if (orig) {
            store.addTrace(zone.id, {
              ...JSON.parse(JSON.stringify(orig)),
              id: crypto.randomUUID(),
              number: nextTraceNumber(),
              points: newPts,
            })
          }
        } else {
          store.updateTrace(zone.id, ds.traceId, { points: newPts })
        }
      } else if (ds.type === 'trace') {
        // Simple click without drag → TraceInfoDialog
        const t = zone.traces.find(t => t.id === ds.traceId)
        if (t) infoTrace.value = t
      }

      void e
    })
  }
}

// ── Scale callbacks ────────────────────────────────────────────────────────
function onScaleDone(p1: [number, number], p2: [number, number]) {
  pendingScalePoints.value = [p1, p2]
  showScaleDialog.value = true
}

function onScaleConfirm(realLength: number) {
  if (!pendingScalePoints.value || !store.activeZone) return
  const scale = buildScale(pendingScalePoints.value, realLength)
  store.updateZone(store.activeZone.id, { scale })
  showScaleDialog.value = false
  pendingScalePoints.value = null
  rerenderAll()
}

// ── Trace callbacks ────────────────────────────────────────────────────────
function onLineDone(points: [number, number][]) {
  const zone = store.activeZone
  const ca = getSelectedCa()
  if (!zone || !ca) return
  const trace: LineTrace = {
    id: crypto.randomUUID(),
    type: 'line',
    number: nextTraceNumber(),
    colorAssignmentId: ca.id,
    up: 0,
    points,
  }
  store.addTrace(zone.id, trace)
  rerenderAll()
  activateTool(store.drawMode)
}

function onPolygonDone(points: [number, number][]) {
  const zone = store.activeZone
  const ca = getSelectedCa()
  if (!zone || !ca) return
  const trace: SurfaceTrace = {
    id: crypto.randomUUID(),
    type: 'surface',
    number: nextTraceNumber(),
    colorAssignmentId: ca.id,
    up: 0,
    points,
    angle: ca.defaultAngle ?? 0,
  }
  store.addTrace(zone.id, trace)
  rerenderAll()
  activateTool(store.drawMode)
}

// ── Image drag & drop ──────────────────────────────────────────────────────
function handleImageDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const dataUrl = ev.target?.result as string
    await imageLoader?.load(dataUrl)
    store.updateZone(store.activeZone!.id, { backgroundImage: dataUrl })
  }
  reader.readAsDataURL(file)
}

// ── Exposed for print ──────────────────────────────────────────────────────
async function getStageDataURL(): Promise<string> {
  return cm?.toDataURL() ?? ''
}

defineExpose({ getStageDataURL })

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  const container = containerRef.value
  if (!container) return

  cm = new CanvasManager('canvas-container', container.clientWidth, container.clientHeight)
  imageLoader = new ImageLoader(cm)
  scaleTool = new ScaleTool(cm, onScaleDone)
  lineTool = new LineTool(cm, onLineDone)
  polygonTool = new PolygonTool(cm, onPolygonDone)
  scaleRenderer = new ScaleRenderer(cm)
  traceRenderer = new TraceRenderer(cm)
  numberRenderer = new NumberRenderer(cm)

  const zone = store.activeZone
  if (zone?.backgroundImage) imageLoader.load(zone.backgroundImage)
  rerenderAll()

  const resizeObs = new ResizeObserver(() => {
    if (!cm || !container) return
    cm.resize(container.clientWidth, container.clientHeight)
    rerenderAll()
  })
  resizeObs.observe(container)

  watch(
    () => [store.drawMode, store.selectedCaId] as const,
    ([mode]) => { activateTool(mode) },
    { immediate: true },
  )

  watch(
    () => store.activeZone,
    (zone) => {
      if (!zone) return
      if (zone.backgroundImage) imageLoader?.load(zone.backgroundImage)
      else imageLoader?.clear()
      rerenderAll()
      activateTool(store.drawMode)
    },
    { deep: true },
  )
})

onUnmounted(() => {
  cm?.destroy()
})
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-wrapper"
    @dragover.prevent
    @drop="handleImageDrop"
  >
    <div id="canvas-container" class="canvas-container" />

    <!-- Tooltip survol trace en mode sélection -->
    <div
      v-if="hoverInfo"
      class="trace-tooltip"
      :style="{ left: hoverPos.x + 'px', top: hoverPos.y + 'px' }"
    >
      {{ hoverInfo }}
    </div>

    <ScaleDialog
      v-if="showScaleDialog"
      @confirm="onScaleConfirm"
      @cancel="showScaleDialog = false"
    />

    <TraceInfoDialog
      v-if="infoTrace"
      :trace="infoTrace"
      @close="infoTrace = null"
    />

    <div v-if="!store.activeZone?.scale" class="hint">
      <span v-if="store.drawMode !== 'scale'">Commencer par tracer l'échelle (outil Echelle)</span>
      <span v-else>Cliquez deux fois pour définir le trait d'échelle</span>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
.canvas-container { width: 100%; height: 100%; }
.trace-tooltip {
  position: absolute;
  background: rgba(0,0,0,0.8);
  color: #facc15;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}
.hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: var(--text-muted);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
