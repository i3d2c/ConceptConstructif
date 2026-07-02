<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { computeTraceChiffrage } from '../domain/services/ChiffrageCalculator'
import type { PrintConfig } from '../print/PrintConfig'
import type { TraceChiffrage } from '../domain/services/ChiffrageCalculator'
import type { OuvrageConstituent } from '../domain/models/Ouvrage'
import { evaluateRecap } from '../domain/services/FormulaEvaluator'

const props = defineProps<{
  config: PrintConfig
  canvas2DImage: string | null
  canvas3DImage: string | null
}>()

const store = useProjectStore()

const traceResults = computed<TraceChiffrage[]>(() => {
  const zone = store.activeZone
  if (!zone?.scale) return []
  const constituentsMap = new Map(store.project.constituents.map(c => [c.id, c]))
  return zone.traces
    .map(trace => {
      const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
      const ouvrage = store.project.ouvrages.find(o => o.id === ca?.ouvrageId)
      if (!ca || !ouvrage) return null
      return computeTraceChiffrage(trace, zone.scale!, ca, ouvrage, constituentsMap)
    })
    .filter(Boolean) as TraceChiffrage[]
})

function ouvrageAdjustedTotal(ouvrageId: string): number {
  const scoped = traceResults.value.filter(t => t.ouvrageId === ouvrageId)
  return ouvrageVisibleOCs(ouvrageId).reduce((s, oc) => {
    const unitPrice = store.project.constituents.find(c => c.id === oc.constituentId)?.unitPrice ?? 0
    return s + ocAggregatedQty(oc, scoped) * unitPrice
  }, 0)
}

const recapOuvrageTotal = computed(() =>
  store.project.ouvrages
    .filter(o => traceResults.value.some(t => t.ouvrageId === o.id))
    .reduce((s, o) => s + ouvrageAdjustedTotal(o.id), 0),
)

const recapConstituentTotal = computed(() =>
  store.project.constituents.reduce((s, c) => {
    const ocs = constituentApplicableOCs(c.id)
    if (ocs.length === 0) return s
    return s + ocs.reduce((ss, oc) => ss + ocAggregatedQty(oc, traceResults.value) * c.unitPrice, 0)
  }, 0),
)

function applyRecap(formulaRecap: string | undefined, X: number): number {
  return formulaRecap ? evaluateRecap(formulaRecap, X) : X
}

function ocAggregatedQty(oc: OuvrageConstituent, scoped: TraceChiffrage[]): number {
  const raw = scoped.flatMap(t => t.constituents)
    .filter(c => c.ouvrageConstituentId === oc.id)
    .reduce((s, c) => s + c.quantity, 0)
  return applyRecap(oc.formulaRecap, raw)
}

function ouvrageVisibleOCs(ouvrageId: string): OuvrageConstituent[] {
  const ouvrage = store.project.ouvrages.find(o => o.id === ouvrageId)
  if (!ouvrage) return []
  const scoped = traceResults.value.filter(t => t.ouvrageId === ouvrageId)
  return ouvrage.constituents.filter(oc => {
    const unitPrice = store.project.constituents.find(c => c.id === oc.constituentId)?.unitPrice ?? 0
    return !oc.disabled
      && !oc.hideFromRecapOuvrage
      && !(oc.hideIfZero && ocAggregatedQty(oc, scoped) === 0)
      && !(oc.hideIfPriceZero && unitPrice === 0)
  })
}

function constituentApplicableOCs(constituentId: string): OuvrageConstituent[] {
  const unitPrice = store.project.constituents.find(c => c.id === constituentId)?.unitPrice ?? 0
  return store.project.ouvrages.flatMap(o => o.constituents)
    .filter(oc => oc.constituentId === constituentId && !oc.disabled && !oc.hideFromRecapConstituent)
    .filter(oc => !(oc.hideIfZero && ocAggregatedQty(oc, traceResults.value) === 0))
    .filter(oc => !(oc.hideIfPriceZero && unitPrice === 0))
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}
</script>

<template>
  <div class="print-layout print-only">

    <!-- Titre -->
    <div v-if="config.title" class="print-title">
      <h1>{{ store.project.name }}</h1>
      <h2>{{ store.activeZone?.name }}</h2>
    </div>

    <!-- Vue 2D -->
    <div v-if="config.show2D && canvas2DImage" class="print-section">
      <h3>Plan 2D</h3>
      <img :src="canvas2DImage" class="print-img" />
    </div>

    <!-- Vue 3D -->
    <div v-if="config.show3D && canvas3DImage" class="print-section">
      <h3>Vue 3D</h3>
      <img :src="canvas3DImage" class="print-img print-img-3d" />
    </div>

    <!-- Récap par ouvrage -->
    <div v-if="config.showRecapOuvrage" class="print-section">
      <h3>Récapitulatif par ouvrage</h3>
      <table class="print-table">
        <thead>
          <tr><th>Ouvrage</th><th>Constituant</th><th>Qté tot.</th><th>Unité</th><th>Total</th></tr>
        </thead>
        <tbody>
          <template v-for="o in store.project.ouvrages" :key="o.id">
            <template v-if="traceResults.some(t => t.ouvrageId === o.id)">
              <tr class="ouvrage-row">
                <td colspan="4" style="font-weight:bold">{{ o.name }}</td>
                <td style="text-align:right">{{ fmt(ouvrageAdjustedTotal(o.id)) }} €</td>
              </tr>
              <tr v-for="oc in ouvrageVisibleOCs(o.id)" :key="oc.id">
                <td />
                <td>{{ store.project.constituents.find(c=>c.id===oc.constituentId)?.name }}</td>
                <td style="text-align:right">{{ fmtQty(ocAggregatedQty(oc, traceResults.filter(t=>t.ouvrageId===o.id))) }}</td>
                <td>{{ store.project.constituents.find(c=>c.id===oc.constituentId)?.unit }}</td>
                <td style="text-align:right">{{ fmt(ocAggregatedQty(oc, traceResults.filter(t=>t.ouvrageId===o.id)) * (store.project.constituents.find(c=>c.id===oc.constituentId)?.unitPrice??0)) }} €</td>
              </tr>
            </template>
          </template>
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="4" style="text-align:right">Total général</td>
            <td style="text-align:right">{{ fmt(recapOuvrageTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Récap par constituant -->
    <div v-if="config.showRecapConstituent" class="print-section">
      <h3>Récapitulatif par constituant</h3>
      <table class="print-table">
        <thead>
          <tr><th>Constituant</th><th>Fournisseur</th><th>Qté tot.</th><th>Unité</th><th>P.U.</th><th>Total</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in store.project.constituents" :key="c.id">
            <template v-if="constituentApplicableOCs(c.id).length > 0">
              <td>{{ c.name }}</td>
              <td>{{ c.supplier ?? '—' }}</td>
              <td style="text-align:right">{{ fmtQty(constituentApplicableOCs(c.id).reduce((s,oc)=>s+ocAggregatedQty(oc,traceResults),0)) }}</td>
              <td>{{ c.unit }}</td>
              <td style="text-align:right">{{ fmt(c.unitPrice) }} €</td>
              <td style="text-align:right">{{ fmt(constituentApplicableOCs(c.id).reduce((s,oc)=>s+ocAggregatedQty(oc,traceResults)*c.unitPrice,0)) }} €</td>
            </template>
          </tr>
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="5" style="text-align:right">Total général</td>
            <td style="text-align:right">{{ fmt(recapConstituentTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Liste détaillée -->
    <div v-if="config.showList" class="print-section">
      <h3>Liste détaillée par tracé</h3>
      <table class="print-table">
        <thead>
          <tr><th>N°</th><th>Constituant</th><th>Qté</th><th>Unité</th><th>P.U.</th><th>Total</th></tr>
        </thead>
        <tbody>
          <template v-for="t in traceResults" :key="t.traceId">
            <tr class="trace-row">
              <td colspan="6">▶ Tracé n°{{ t.traceNumber }} — {{ t.ouvrageName }}</td>
            </tr>
            <template v-for="c in t.constituents" :key="c.ouvrageConstituentId">
              <tr v-if="!(c.hideIfZero && c.quantity === 0) && !(c.hideIfPriceZero && c.unitPrice === 0)">
                <td />
                <td>{{ c.name }}</td>
                <td style="text-align:right">{{ fmtQty(c.quantity) }}</td>
                <td>{{ c.unit }}</td>
                <td style="text-align:right">{{ fmt(c.unitPrice) }} €</td>
                <td style="text-align:right">{{ fmt(c.total) }} €</td>
              </tr>
            </template>
            <tr>
              <td colspan="5" style="text-align:right;font-style:italic">Sous-total</td>
              <td style="text-align:right">{{ fmt(t.subtotal) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align:right;font-weight:bold">Total général</td>
            <td style="text-align:right;font-weight:bold">{{ fmt(recapConstituentTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

  </div>
</template>

<style scoped>
.print-layout { font-family: Arial, sans-serif; font-size: 11pt; color: black; }
.print-title { margin-bottom: 16pt; }
.print-title h1 { font-size: 18pt; }
.print-title h2 { font-size: 14pt; color: #444; }
.print-section { margin-bottom: 20pt; page-break-inside: avoid; }
.print-section h3 { font-size: 13pt; border-bottom: 1px solid #ccc; margin-bottom: 8pt; }
.print-img { max-width: 100%; border: 1px solid #ccc; }
.print-img-3d { max-width: 55%; display: block; margin: 0 auto; }
.print-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.print-table th { background: #eee; padding: 3pt 5pt; border: 1px solid #ccc; text-align: left; }
.print-table td { padding: 2pt 5pt; border: 1px solid #ddd; }
.ouvrage-row td { background: #f5f5f5; }
.trace-row td { background: #f0f4ff; font-style: italic; }
</style>
