<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { computeTraceVariables, computeTraceChiffrage } from '../domain/services/ChiffrageCalculator'
import type { SlopeDirection } from '../domain/models/Trace'
import type { Scale } from '../domain/models/Scale'

const store = useProjectStore()
const collapsed = ref(false)

const zone = computed(() => store.activeZone)
const trace = computed(() => store.selectedTrace)

const gettingStarted = computed(() => {
  const z = zone.value
  if (!z) return null
  const hasBackgroundImage = !!z.backgroundImage
  const hasScale = !!z.scale
  const hasOuvrage = store.project.ouvrages.length > 0
  const hasColorAssignment = z.colorAssignments.length > 0
  const hasTrace = z.traces.length > 0
  if (hasScale && hasOuvrage && hasColorAssignment && hasTrace) return null
  return { hasBackgroundImage, hasScale, hasOuvrage, hasColorAssignment, hasTrace }
})

const drawModeHints: Record<string, string> = {
  select: 'Mode sélection — cliquez sur un tracé pour afficher ses informations.',
  scale: 'Mode échelle — cliquez deux points puis indiquez la distance réelle.',
  line: 'Mode trait — cliquez pour placer les points, double-clic pour terminer.',
  surface: 'Mode surface — cliquez pour placer les sommets, double-clic pour fermer.',
}
const drawModeHint = computed(() => drawModeHints[store.drawMode] ?? '')

const ca = computed(() => zone.value?.colorAssignments.find(c => c.id === trace.value?.colorAssignmentId))
const ouvrage = computed(() => store.project.ouvrages.find(o => o.id === ca.value?.ouvrageId))

// Pendant un drag sur le canvas, on prévisualise les points en cours plutôt que ceux persistés
const liveTrace = computed(() => {
  if (!trace.value) return null
  return store.liveTracePoints ? { ...trace.value, points: store.liveTracePoints } : trace.value
})

const vars = computed(() => {
  if (!liveTrace.value || !zone.value?.scale || !ca.value) return null
  const angleDeg = liveTrace.value.type === 'surface' ? (liveTrace.value.angle ?? 0) : 0
  return computeTraceVariables(liveTrace.value.type, liveTrace.value.points, zone.value.scale, ca.value, angleDeg)
})

const chiffrage = computed(() => {
  if (!liveTrace.value || !zone.value?.scale || !ca.value || !ouvrage.value) return null
  const constituentsMap = new Map(store.project.constituents.map(c => [c.id, c]))
  return computeTraceChiffrage(liveTrace.value, zone.value.scale, ca.value, ouvrage.value, constituentsMap)
})

// ── Élévation ─────────────────────────────────────────────────────────────
const localUp = ref(0)
watch(trace, (t) => { if (t) localUp.value = t.up }, { immediate: true })

function applyUp() {
  if (!zone.value || !trace.value) return
  store.updateTrace(zone.value.id, trace.value.id, { up: localUp.value })
}

// ── Angle ─────────────────────────────────────────────────────────────────
const localAngle = ref(0)
const localDirection = ref<SlopeDirection>('top')
watch(trace, (t) => {
  if (t?.type === 'surface') {
    localAngle.value = t.angle ?? 0
    localDirection.value = t.slopeDirection ?? 'top'
  }
}, { immediate: true })

function applyAngle() {
  if (!zone.value || !trace.value || trace.value.type !== 'surface') return
  store.updateTrace(zone.value.id, trace.value.id, { angle: localAngle.value })
}

function setDirection(d: SlopeDirection) {
  if (!zone.value || !trace.value || trace.value.type !== 'surface') return
  localDirection.value = d
  store.updateTrace(zone.value.id, trace.value.id, { slopeDirection: d })
}

// ── Redimensionnement ──────────────────────────────────────────────────────
const resizeL = ref('')
const resizeH = ref('')

watch(vars, (v) => {
  if (!v || !trace.value) return
  resizeL.value = v.L.toFixed(3)
  if (trace.value.type === 'surface') resizeH.value = v.H.toFixed(3)
}, { immediate: true })

function parseM(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) || n <= 0 ? null : n
}

function resizeLine(pts: [number, number][], newLMeters: number, scale: Scale): [number, number][] {
  if (pts.length < 2) return pts
  let curLen = 0
  for (let i = 0; i < pts.length - 1; i++) {
    curLen += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
  }
  if (curLen === 0) return pts
  const factor = (newLMeters / scale.ratio) / curLen
  const start = pts[0]
  return pts.map((p, i) =>
    i === 0 ? p : [start[0] + (p[0] - start[0]) * factor, start[1] + (p[1] - start[1]) * factor]
  )
}

function resizeSurface(
  pts: [number, number][],
  newLMeters: number | null,
  newHMeters: number | null,
  scale: Scale,
): [number, number][] {
  const xs = pts.map(p => p[0])
  const ys = pts.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const curW = maxX - minX || 1
  const curH = maxY - minY || 1
  const scaleX = newLMeters !== null ? (newLMeters / scale.ratio) / curW : 1
  const scaleY = newHMeters !== null ? (newHMeters / scale.ratio) / curH : 1
  return pts.map(p => [cx + (p[0] - cx) * scaleX, cy + (p[1] - cy) * scaleY])
}

function applyResize() {
  const s = zone.value?.scale
  if (!s || !zone.value || !trace.value) return

  let newPts: [number, number][]
  if (trace.value.type === 'line') {
    const newL = parseM(resizeL.value)
    if (!newL) return
    newPts = resizeLine(trace.value.points, newL, s)
  } else {
    const newL = parseM(resizeL.value)
    const newH = parseM(resizeH.value)
    if (!newL && !newH) return
    newPts = resizeSurface(trace.value.points, newL, newH, s)
  }

  store.updateTrace(zone.value.id, trace.value.id, { points: newPts })
}

function deleteTrace() {
  if (!zone.value || !trace.value) return
  store.removeTrace(zone.value.id, trace.value.id)
}

// ── Formatage ──────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(n)
}
</script>

<template>
  <aside class="sidebar-right no-print" :class="{ collapsed }">
    <button
      class="collapse-toggle"
      :title="collapsed ? 'Agrandir le panneau' : 'Réduire le panneau'"
      @click="collapsed = !collapsed"
    >
      {{ collapsed ? '◂' : '▸' }}
    </button>

    <div v-if="!collapsed" class="content">
      <template v-if="trace">
        <div class="panel-header">
          Tracé n°{{ trace.number }} — {{ trace.type === 'line' ? 'Trait' : 'Surface' }}
        </div>

        <!-- Assignation couleur -->
        <div v-if="ca" class="section">
          <div class="section-title">Assignation</div>
          <div class="info-row">
            <span class="dot" :style="{ background: ca.color }" />
            <span>{{ ouvrage?.name ?? '—' }}</span>
          </div>
          <div class="info-grid">
            <span class="label">E</span><span>{{ ca.epaisseur }} m</span>
            <span class="label">H</span><span>{{ ca.hauteur }} m</span>
          </div>
        </div>

        <!-- Dimensions calculées (lecture seule) -->
        <div v-if="vars" class="section">
          <div class="section-title">Dimensions calculées</div>
          <div class="info-grid">
            <span class="label">L</span><span>{{ fmtQty(vars.L) }} m</span>
            <span class="label">H</span><span>{{ fmtQty(vars.H) }} m</span>
            <span class="label">E</span><span>{{ fmtQty(vars.E) }} m</span>
            <span class="label">S</span><span>{{ fmtQty(vars.S) }} m²</span>
            <span class="label">V</span><span>{{ fmtQty(vars.V) }} m³</span>
          </div>
        </div>
        <div v-else class="hint">Posez une échelle pour voir les dimensions réelles.</div>

        <!-- Élévation 3D -->
        <div class="section">
          <div class="section-title">Vue 3D</div>
          <div class="resize-row">
            <label>Sol (m)</label>
            <input v-model.number="localUp" type="number" step="0.1" min="0" class="dim-input" @change="applyUp" @keyup.enter="applyUp" />
          </div>
          <div class="resize-hint">Distance au sol (surélève l'élément en 3D).</div>
        </div>

        <div v-if="trace.type === 'surface'" class="section">
          <div class="resize-row">
            <label>Angle (°)</label>
            <input v-model.number="localAngle" type="number" step="1" min="0" max="89" class="dim-input" @change="applyAngle" @keyup.enter="applyAngle" />
          </div>
          <div class="resize-hint">Inclinaison de la surface (corrige l'aire réelle et l'orientation en 3D).</div>

          <div class="resize-row">
            <label>Pente</label>
            <div class="dir-btns">
              <button :class="{ active: localDirection === 'top' }" @click="setDirection('top')">Haut</button>
              <button :class="{ active: localDirection === 'bottom' }" @click="setDirection('bottom')">Bas</button>
              <button :class="{ active: localDirection === 'left' }" @click="setDirection('left')">Gauche</button>
              <button :class="{ active: localDirection === 'right' }" @click="setDirection('right')">Droite</button>
            </div>
          </div>
          <div class="resize-hint">Bord bas de la pente ; le bord opposé remonte, symétriquement autour du centre.</div>
        </div>

        <!-- Redimensionnement -->
        <div v-if="vars" class="section">
          <div class="section-title">Redimensionner</div>
          <div v-if="trace.type === 'line'" class="resize-row">
            <label>L (m)</label>
            <input v-model="resizeL" type="text" class="dim-input" @keyup.enter="applyResize" />
            <button class="active small" @click="applyResize">Appliquer</button>
          </div>
          <div v-else class="resize-col">
            <div class="resize-row">
              <label>L (m)</label>
              <input v-model="resizeL" type="text" class="dim-input" @keyup.enter="applyResize" />
            </div>
            <div class="resize-row">
              <label>H (m)</label>
              <input v-model="resizeH" type="text" class="dim-input" @keyup.enter="applyResize" />
            </div>
            <button class="active small" style="align-self:flex-end" @click="applyResize">Appliquer</button>
          </div>
          <div class="resize-hint">
            {{ trace.type === 'line'
              ? 'Modifie la longueur du trait en gardant le point de départ fixe.'
              : 'Redimensionne depuis le centre du bounding box.' }}
          </div>
        </div>

        <!-- Chiffrage -->
        <div v-if="chiffrage" class="section">
          <div class="section-title">Chiffrage</div>
          <table class="mini-table">
            <thead>
              <tr><th>Constituant</th><th>Qté</th><th>Unité</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in chiffrage.constituents" :key="c.ouvrageConstituentId">
                <td>{{ c.name }}</td>
                <td style="text-align:right" :title="c.error || undefined">
                  <span v-if="c.error" class="error-cell">⚠ Erreur</span>
                  <span v-else>{{ fmtQty(c.quantity) }}</span>
                </td>
                <td>{{ c.unit }}</td>
                <td style="text-align:right">{{ fmt(c.total) }} €</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align:right;font-style:italic">Sous-total</td>
                <td style="text-align:right;font-weight:bold">{{ fmt(chiffrage.subtotal) }} €</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="panel-actions">
          <button class="danger" @click="deleteTrace">Supprimer</button>
        </div>
      </template>

      <template v-else>
        <div v-if="gettingStarted" data-testid="getting-started-checklist" class="checklist">
          <div class="section-title">Pour démarrer</div>
          <div class="step" data-step="background" :class="{ done: gettingStarted.hasBackgroundImage }">
            <span class="step-mark">{{ gettingStarted.hasBackgroundImage ? '✓' : '1' }}</span>
            <span>Importer un plan (facultatif) — collez ou glissez une image directement dans la zone 2D.</span>
          </div>
          <div class="step" data-step="scale" :class="{ done: gettingStarted.hasScale }">
            <span class="step-mark">{{ gettingStarted.hasScale ? '✓' : '2' }}</span>
            <span>Créer une échelle en cliquant sur « Echelle ».</span>
          </div>
          <div class="step" data-step="ouvrage" :class="{ done: gettingStarted.hasOuvrage }">
            <span class="step-mark">{{ gettingStarted.hasOuvrage ? '✓' : '3' }}</span>
            <span>Créer ou importer des ouvrages via « Ouvrages &amp; Constituants » pour les ajouter au projet.</span>
          </div>
          <div class="step" data-step="color" :class="{ done: gettingStarted.hasColorAssignment }">
            <span class="step-mark">{{ gettingStarted.hasColorAssignment ? '✓' : '4' }}</span>
            <span>Assigner une couleur à un ouvrage du projet.</span>
          </div>
          <div class="step" data-step="trace" :class="{ done: gettingStarted.hasTrace }">
            <span class="step-mark">{{ gettingStarted.hasTrace ? '✓' : '5' }}</span>
            <span>Tracer les traits et/ou les surfaces selon votre plan.</span>
          </div>
        </div>

        <div v-else class="empty-hint">
          <p>Sélectionnez un tracé sur le plan pour afficher ses informations.</p>
          <p class="mode-hint">{{ drawModeHint }}</p>
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-right {
  width: var(--sidebar-right-w);
  flex-shrink: 0;
  background: var(--surface);
  overflow: hidden;
  display: flex;
}
.sidebar-right.collapsed {
  width: 22px;
}
.collapse-toggle {
  width: 22px;
  flex-shrink: 0;
  background: var(--surface2);
  border: none;
  border-right: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 19.5px;
  font-weight: 700;
}
.collapse-toggle:hover { background: var(--hover); color: var(--text); }
.content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.panel-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 13px;
}
.section { padding: 10px 14px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
.section-title { font-size: 10px; text-transform: uppercase; color: var(--text-muted); }
.info-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.dot { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
.info-grid { display: grid; grid-template-columns: 20px 1fr; gap: 2px 8px; font-size: 12px; }
.label { color: var(--text-muted); }
.hint { padding: 10px 14px; font-size: 11px; color: var(--text-muted); }
.resize-row { display: flex; align-items: center; gap: 8px; }
.resize-row label { width: 36px; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.resize-col { display: flex; flex-direction: column; gap: 6px; }
.dim-input { width: 90px; font-size: 12px; text-align: right; }
.dir-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; flex: 1; }
.dir-btns button { padding: 3px 6px; font-size: 11px; }
.resize-hint { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
.small { padding: 3px 10px; font-size: 11px; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.mini-table th { background: var(--surface2); padding: 3px 6px; text-align: left; border-bottom: 1px solid var(--border); }
.mini-table td { padding: 2px 6px; }
.mini-table tfoot td { border-top: 1px solid var(--border); }
.panel-actions { padding: 10px 14px; }
button.danger { background: #7f1d1d; color: #fca5a5; border-color: #991b1b; }
button.danger:hover { background: #991b1b; }
.error-cell { color: #f87171; font-style: italic; }

.checklist { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
.step.done { color: var(--text); }
.step-mark {
  width: 18px; height: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: 1px solid var(--border);
  font-size: 10px;
}
.step.done .step-mark { background: var(--accent); border-color: var(--accent); color: #fff; }
.empty-hint { padding: 14px; font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px; }
.mode-hint { font-size: 11px; }
</style>
