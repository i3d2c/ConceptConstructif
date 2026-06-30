<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, inject } from 'vue'
import type { Ref } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { CanvasManager } from '../canvas/CanvasManager'
import { ImageLoader } from '../canvas/ImageLoader'
import { ScaleTool } from '../canvas/tools/ScaleTool'
import { LineTool } from '../canvas/tools/LineTool'
import { PolygonTool } from '../canvas/tools/PolygonTool'
import { ScaleRenderer } from '../canvas/renderers/ScaleRenderer'
import { TraceRenderer } from '../canvas/renderers/TraceRenderer'
import { NumberRenderer } from '../canvas/renderers/NumberRenderer'
import { TraceTransformer } from '../canvas/interactions/TraceTransformer'
import { buildScale } from '../domain/services/ScaleCalculator'
import type { LineTrace, SurfaceTrace } from '../domain/models/Trace'
import ScaleDialog from './dialogs/ScaleDialog.vue'

const store = useProjectStore()
const containerRef = ref<HTMLDivElement | null>(null)
const drawMode = inject<Ref<string>>('drawMode')

let cm: CanvasManager | null = null
let imageLoader: ImageLoader | null = null
let scaleTool: ScaleTool | null = null
let lineTool: LineTool | null = null
let polygonTool: PolygonTool | null = null
let scaleRenderer: ScaleRenderer | null = null
let traceRenderer: TraceRenderer | null = null
let numberRenderer: NumberRenderer | null = null
let transformer: TraceTransformer | null = null

const showScaleDialog = ref(false)
const pendingScalePoints = ref<[[number, number], [number, number]] | null>(null)
const selectedCaId = ref<string | null>(null)
const selectedTraceId = ref<string | null>(null)

function getSelectedCa() {
  if (!selectedCaId.value || !store.activeZone) return null
  return store.activeZone.colorAssignments.find(c => c.id === selectedCaId.value) ?? null
}

function rerenderAll() {
  const zone = store.activeZone
  if (!cm || !zone) return
  traceRenderer?.renderAll(zone.traces, zone.colorAssignments, zone.scale)
  numberRenderer?.renderAll(zone.traces, zone.colorAssignments)
  if (zone.scale) scaleRenderer?.render(zone.scale)
  else scaleRenderer?.clear()
}

function activateTool(mode: string) {
  scaleTool?.deactivate()
  lineTool?.deactivate()
  polygonTool?.deactivate()
  transformer?.deactivate()

  const zone = store.activeZone
  if (!zone) return

  if (mode === 'scale') {
    scaleTool?.activate()
  } else if (mode === 'line') {
    const ca = getSelectedCa()
    if (!ca || !zone.scale) return
    const strokeWidth = ca.epaisseur / zone.scale.ratio
    lineTool?.activate(ca.color, Math.max(strokeWidth, 1))
  } else if (mode === 'surface') {
    const ca = getSelectedCa()
    if (!ca) return
    polygonTool?.activate(ca.color)
  } else if (mode === 'select') {
    transformer?.activate(zone.traces)
  }
}

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

function nextTraceNumber(): number {
  return (store.activeZone?.traces.reduce((m, t) => Math.max(m, t.number), 0) ?? 0) + 1
}

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
  activateTool(drawMode?.value ?? 'select')
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
  activateTool(drawMode?.value ?? 'select')
}

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

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  const w = container.clientWidth
  const h = container.clientHeight

  cm = new CanvasManager('canvas-container', w, h)
  imageLoader = new ImageLoader(cm)
  scaleTool = new ScaleTool(cm, onScaleDone)
  lineTool = new LineTool(cm, onLineDone)
  polygonTool = new PolygonTool(cm, onPolygonDone)
  scaleRenderer = new ScaleRenderer(cm)
  traceRenderer = new TraceRenderer(cm)
  numberRenderer = new NumberRenderer(cm)
  transformer = new TraceTransformer(
    cm,
    (traceId, newPoints) => {
      const zone = store.activeZone
      if (zone) store.updateTrace(zone.id, traceId, { points: newPoints })
    },
    (traceId) => { selectedTraceId.value = traceId },
  )

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
    () => drawMode?.value,
    (mode) => { if (mode) activateTool(mode) },
    { immediate: true },
  )

  watch(
    () => store.activeZone,
    (zone) => {
      if (!zone) return
      if (zone.backgroundImage) imageLoader?.load(zone.backgroundImage)
      else imageLoader?.clear()
      rerenderAll()
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

    <ScaleDialog
      v-if="showScaleDialog"
      @confirm="onScaleConfirm"
      @cancel="showScaleDialog = false"
    />

    <div v-if="!store.activeZone?.scale" class="hint">
      Glisser-déposer une image de plan, puis tracer l'échelle
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
}
</style>
