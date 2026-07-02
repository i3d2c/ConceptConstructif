<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { computeTraceChiffrage } from '../domain/services/ChiffrageCalculator'
import type { TraceChiffrage } from '../domain/services/ChiffrageCalculator'
import type { OuvrageConstituent } from '../domain/models/Ouvrage'
import { evaluateRecap } from '../domain/services/FormulaEvaluator'

const store = useProjectStore()
const tab = ref<'list' | 'ouvrage' | 'constituent'>('list')

const traceResults = computed<TraceChiffrage[]>(() => {
  const zone = store.activeZone
  if (!zone?.scale) return []

  const constituentsMap = new Map(store.project.constituents.map(c => [c.id, c]))
  const results: TraceChiffrage[] = []

  for (const trace of zone.traces) {
    const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
    if (!ca) continue
    const ouvrage = store.project.ouvrages.find(o => o.id === ca.ouvrageId)
    if (!ouvrage) continue
    results.push(computeTraceChiffrage(trace, zone.scale, ca, ouvrage, constituentsMap))
  }

  return results
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

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtQty(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}
</script>

<template>
  <div class="chiffrage-float">
    <div class="tabs">
      <button :class="{ active: tab === 'list' }" @click="tab = 'list'">Liste détaillée</button>
      <button :class="{ active: tab === 'ouvrage' }" @click="tab = 'ouvrage'">Récap/Ouvrage</button>
      <button :class="{ active: tab === 'constituent' }" @click="tab = 'constituent'">Récap/Constituant</button>
    </div>

    <div v-if="!store.activeZone?.scale" class="empty">
      Définissez d'abord l'échelle pour calculer le chiffrage.
    </div>

    <!-- Onglet 1 : liste détaillée -->
    <div v-else-if="tab === 'list'" class="scroll-body">
      <table>
        <thead>
          <tr><th>N°</th><th>Constituant</th><th class="num">Qté</th><th>Unité</th><th class="num">P.U.</th><th class="num">Total</th></tr>
        </thead>
        <tbody>
          <template v-for="t in traceResults" :key="t.traceId">
            <tr class="trace-header">
              <td colspan="6">
                ▶ Tracé n°{{ t.traceNumber }} — {{ t.ouvrageName }}
                (L={{ fmtQty(t.vars.L) }}m · H={{ fmtQty(t.vars.H) }}m · E={{ fmtQty(t.vars.E) }}m)
              </td>
            </tr>
            <template v-for="c in t.constituents" :key="c.ouvrageConstituentId">
              <tr v-if="!(c.hideIfZero && c.quantity === 0) && !(c.hideIfPriceZero && c.unitPrice === 0)">
                <td />
                <td>
                  <a v-if="c.url" :href="c.url" target="_blank" rel="noopener">{{ c.name }}</a>
                  <span v-else>{{ c.name }}</span>
                </td>
                <td class="num">{{ fmtQty(c.quantity) }}</td>
                <td>{{ c.unit }}</td>
                <td class="num">{{ fmt(c.unitPrice) }} €</td>
                <td class="num">{{ fmt(c.total) }} €</td>
              </tr>
            </template>
            <tr class="subtotal-row">
              <td colspan="5" class="right">Sous-total</td>
              <td class="num">{{ fmt(t.subtotal) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right grand">Total général</td>
            <td class="num grand">{{ fmt(recapConstituentTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Onglet 2 : récap par ouvrage -->
    <div v-else-if="tab === 'ouvrage'" class="scroll-body">
      <table>
        <thead>
          <tr><th>Ouvrage</th><th>Constituant</th><th class="num">Qté tot.</th><th>Unité</th><th class="num">P.U.</th><th class="num">Total</th></tr>
        </thead>
        <tbody>
          <template v-for="ouvrage in store.project.ouvrages" :key="ouvrage.id">
            <template v-if="traceResults.some(t => t.ouvrageId === ouvrage.id)">
              <tr class="ouvrage-header">
                <td colspan="5">{{ ouvrage.name }}</td>
                <td class="num">{{ fmt(ouvrageAdjustedTotal(ouvrage.id)) }} €</td>
              </tr>
              <tr v-for="oc in ouvrageVisibleOCs(ouvrage.id)" :key="oc.id">
                <td />
                <td>{{ store.project.constituents.find(c => c.id === oc.constituentId)?.name }}</td>
                <td class="num">{{ fmtQty(ocAggregatedQty(oc, traceResults.filter(t => t.ouvrageId === ouvrage.id))) }}</td>
                <td>{{ store.project.constituents.find(c => c.id === oc.constituentId)?.unit }}</td>
                <td class="num">{{ fmt(store.project.constituents.find(c => c.id === oc.constituentId)?.unitPrice ?? 0) }} €</td>
                <td class="num">{{ fmt(ocAggregatedQty(oc, traceResults.filter(t => t.ouvrageId === ouvrage.id)) * (store.project.constituents.find(c => c.id === oc.constituentId)?.unitPrice ?? 0)) }} €</td>
              </tr>
            </template>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right grand">Total général</td>
            <td class="num grand">{{ fmt(recapOuvrageTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Onglet 3 : récap par constituant -->
    <div v-else-if="tab === 'constituent'" class="scroll-body">
      <table>
        <thead>
          <tr><th>Constituant</th><th>Fournisseur</th><th class="num">Qté tot.</th><th>Unité</th><th class="num">P.U.</th><th class="num">Total</th></tr>
        </thead>
        <tbody>
          <template v-for="c in store.project.constituents" :key="c.id">
            <template v-if="constituentApplicableOCs(c.id).length > 0">
              <tr>
                <td>
                  <a v-if="c.url" :href="c.url" target="_blank" rel="noopener">{{ c.name }}</a>
                  <span v-else>{{ c.name }}</span>
                </td>
                <td>{{ c.supplier ?? '—' }}</td>
                <td class="num">{{
                  fmtQty(constituentApplicableOCs(c.id)
                    .reduce((s, oc) => s + ocAggregatedQty(oc, traceResults), 0))
                }}</td>
                <td>{{ c.unit }}</td>
                <td class="num">{{ fmt(c.unitPrice) }} €</td>
                <td class="num">{{
                  fmt(constituentApplicableOCs(c.id)
                    .reduce((s, oc) => s + ocAggregatedQty(oc, traceResults) * c.unitPrice, 0))
                }} €</td>
              </tr>
            </template>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right grand">Total général</td>
            <td class="num grand">{{ fmt(recapConstituentTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
.chiffrage-float { display: flex; flex-direction: column; height: 100%; }
.tabs { display: flex; gap: 4px; padding: 6px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.tabs button { font-size: 11px; padding: 3px 8px; }
.empty { padding: 20px; text-align: center; color: var(--text-muted); }
.scroll-body { flex: 1; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th { background: var(--surface2); padding: 4px 6px; text-align: left; position: sticky; top: 0; }
td { padding: 3px 6px; border-bottom: 1px solid var(--border); }
.num { text-align: right; }
.right { text-align: right; }
.trace-header td { background: rgba(255,255,255,0.04); color: var(--text-muted); font-style: italic; padding: 4px 6px; }
.ouvrage-header td { background: rgba(255,255,255,0.06); font-weight: 600; }
.subtotal-row td { color: var(--text-muted); font-size: 10px; }
.grand { font-weight: 700; font-size: 12px; }
a { color: #60a5fa; }
</style>
