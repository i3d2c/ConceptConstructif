import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project } from '../domain/models/Project'
import type { Zone } from '../domain/models/Zone'
import type { Ouvrage } from '../domain/models/Ouvrage'
import type { Constituent } from '../domain/models/Constituent'
import type { Trace } from '../domain/models/Trace'
import type { ColorAssignment } from '../domain/models/Zone'
import { HistoryManager } from '../domain/services/HistoryManager'
import { saveProject, loadProject } from '../storage/ProjectStore'

function newProject(): Project {
  const zoneId = crypto.randomUUID()
  return {
    id: crypto.randomUUID(),
    name: 'Nouveau projet',
    ouvrages: [],
    constituents: [],
    zones: [{
      id: zoneId,
      name: 'Zone 1',
      scale: null,
      backgroundImage: null,
      colorAssignments: [],
      traces: [],
    }],
    activeZoneId: zoneId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export type DrawMode = 'select' | 'scale' | 'line' | 'surface'

export const useProjectStore = defineStore('project', () => {
  const project = ref<Project>(newProject())
  const history = new HistoryManager(20)

  // UI state (non persisté)
  const drawMode = ref<DrawMode>('select')
  const selectedCaId = ref<string | null>(null)

  const activeZone = computed<Zone | undefined>(
    () => project.value.zones.find(z => z.id === project.value.activeZoneId),
  )

  function snapshot() {
    history.push(project.value)
  }

  function undo() {
    const prev = history.undo(project.value)
    if (prev) project.value = prev
  }

  function redo() {
    const next = history.redo(project.value)
    if (next) project.value = next
  }

  const canUndo = computed(() => history.canUndo)
  const canRedo = computed(() => history.canRedo)

  function setDrawMode(mode: DrawMode) {
    drawMode.value = mode
  }

  function setSelectedCaId(id: string | null) {
    selectedCaId.value = id
  }

  // ── Zones ──────────────────────────────────────────────────────────────
  function setActiveZone(id: string) {
    project.value.activeZoneId = id
    selectedCaId.value = null
  }

  function addZone(zone: Zone) {
    snapshot()
    project.value.zones.push(zone)
    project.value.activeZoneId = zone.id
  }

  function updateZone(zoneId: string, patch: Partial<Omit<Zone, 'id'>>) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (z) Object.assign(z, patch)
  }

  function removeZone(zoneId: string) {
    if (project.value.zones.length <= 1) return
    snapshot()
    project.value.zones = project.value.zones.filter(z => z.id !== zoneId)
    if (project.value.activeZoneId === zoneId) {
      project.value.activeZoneId = project.value.zones[0].id
    }
  }

  // ── Traces ─────────────────────────────────────────────────────────────
  function addTrace(zoneId: string, trace: Trace) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (z) z.traces.push(trace)
  }

  function updateTrace(zoneId: string, traceId: string, patch: Partial<Trace>) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (!z) return
    const idx = z.traces.findIndex(t => t.id === traceId)
    if (idx !== -1) z.traces[idx] = { ...z.traces[idx], ...patch } as Trace
  }

  function removeTrace(zoneId: string, traceId: string) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (z) z.traces = z.traces.filter(t => t.id !== traceId)
  }

  // ── ColorAssignments ───────────────────────────────────────────────────
  function addColorAssignment(zoneId: string, ca: ColorAssignment) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (z) z.colorAssignments.push(ca)
  }

  function updateColorAssignment(zoneId: string, caId: string, patch: Partial<ColorAssignment>) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (!z) return
    const ca = z.colorAssignments.find(c => c.id === caId)
    if (ca) Object.assign(ca, patch)
  }

  function removeColorAssignment(zoneId: string, caId: string) {
    snapshot()
    const z = project.value.zones.find(z => z.id === zoneId)
    if (!z) return
    z.colorAssignments = z.colorAssignments.filter(c => c.id !== caId)
    z.traces = z.traces.filter(t => t.colorAssignmentId !== caId)
  }

  // ── Ouvrages ───────────────────────────────────────────────────────────
  function addOuvrage(ouvrage: Ouvrage) {
    snapshot()
    project.value.ouvrages.push(ouvrage)
  }

  function updateOuvrage(id: string, patch: Partial<Ouvrage>) {
    snapshot()
    const o = project.value.ouvrages.find(o => o.id === id)
    if (o) Object.assign(o, patch)
  }

  function removeOuvrage(id: string) {
    snapshot()
    project.value.ouvrages = project.value.ouvrages.filter(o => o.id !== id)
  }

  // ── Constituants ───────────────────────────────────────────────────────
  function addConstituent(c: Constituent) {
    snapshot()
    project.value.constituents.push(c)
  }

  function updateConstituent(id: string, patch: Partial<Constituent>) {
    snapshot()
    const c = project.value.constituents.find(c => c.id === id)
    if (c) Object.assign(c, patch)
  }

  function removeConstituent(id: string) {
    snapshot()
    project.value.constituents = project.value.constituents.filter(c => c.id !== id)
  }

  // ── Persistence ────────────────────────────────────────────────────────
  async function save() {
    project.value.updatedAt = new Date().toISOString()
    await saveProject(project.value)
  }

  async function load(id: string) {
    const p = await loadProject(id)
    if (p) project.value = p
  }

  function reset() {
    project.value = newProject()
  }

  return {
    project,
    activeZone,
    drawMode,
    selectedCaId,
    setDrawMode,
    setSelectedCaId,
    canUndo,
    canRedo,
    undo,
    redo,
    setActiveZone,
    addZone,
    updateZone,
    removeZone,
    addTrace,
    updateTrace,
    removeTrace,
    addColorAssignment,
    updateColorAssignment,
    removeColorAssignment,
    addOuvrage,
    updateOuvrage,
    removeOuvrage,
    addConstituent,
    updateConstituent,
    removeConstituent,
    save,
    load,
    reset,
  }
})
