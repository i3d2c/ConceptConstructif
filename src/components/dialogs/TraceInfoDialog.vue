<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import { computeTraceVariables, computeTraceChiffrage } from '../../domain/services/ChiffrageCalculator'
import type { Trace } from '../../domain/models/Trace'

const props = defineProps<{ trace: Trace }>()
const emit = defineEmits<{ close: [] }>()

const store = useProjectStore()

const zone = computed(() => store.activeZone)
const ca = computed(() => zone.value?.colorAssignments.find(c => c.id === props.trace.colorAssignmentId))
const ouvrage = computed(() => store.project.ouvrages.find(o => o.id === ca.value?.ouvrageId))

const vars = computed(() => {
  if (!zone.value?.scale || !ca.value) return null
  const angleDeg = props.trace.type === 'surface' ? (props.trace.angle ?? 0) : 0
  return computeTraceVariables(props.trace.type, props.trace.points, zone.value.scale, ca.value, angleDeg)
})

const chiffrage = computed(() => {
  if (!zone.value?.scale || !ca.value || !ouvrage.value) return null
  const constituentsMap = new Map(store.project.constituents.map(c => [c.id, c]))
  return computeTraceChiffrage(props.trace, zone.value.scale, ca.value, ouvrage.value, constituentsMap)
})

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(n)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <span>Tracé n°{{ trace.number }} — {{ trace.type === 'line' ? 'Trait' : 'Surface' }}</span>
        <button class="close-btn" @click="emit('close')">✕</button>
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
          <span v-if="trace.type === 'surface'" class="label">Angle</span>
          <span v-if="trace.type === 'surface'">{{ (trace as any).angle ?? 0 }}°</span>
        </div>
      </div>

      <!-- Dimensions calculées -->
      <div v-if="vars" class="section">
        <div class="section-title">Dimensions</div>
        <div class="info-grid">
          <span class="label">L</span><span>{{ fmtQty(vars.L) }} m</span>
          <span class="label">H</span><span>{{ fmtQty(vars.H) }} m</span>
          <span class="label">E</span><span>{{ fmtQty(vars.E) }} m</span>
          <span class="label">S</span><span>{{ fmtQty(vars.S) }} m²</span>
          <span class="label">V</span><span>{{ fmtQty(vars.V) }} m³</span>
        </div>
      </div>
      <div v-else class="hint">Posez une échelle pour voir les dimensions réelles.</div>

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
              <td style="text-align:right">{{ fmtQty(c.quantity) }}</td>
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

      <div class="dialog-actions">
        <button class="active" @click="emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 800;
}
.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 0;
}
.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 600; font-size: 13px;
}
.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; }
.section { padding: 10px 14px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
.section-title { font-size: 10px; text-transform: uppercase; color: var(--text-muted); }
.info-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.dot { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
.info-grid { display: grid; grid-template-columns: 20px 1fr; gap: 2px 8px; font-size: 12px; }
.label { color: var(--text-muted); }
.hint { padding: 10px 14px; font-size: 11px; color: var(--text-muted); }
.mini-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.mini-table th { background: var(--surface2); padding: 3px 6px; text-align: left; border-bottom: 1px solid var(--border); }
.mini-table td { padding: 2px 6px; }
.mini-table tfoot td { border-top: 1px solid var(--border); }
.dialog-actions { padding: 10px 14px; display: flex; justify-content: flex-end; }
</style>
