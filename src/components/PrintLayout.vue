<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { useSettingsStore } from '../stores/settingsStore'
import { buildPrintData } from '../print/buildPrintData'
import { buildPrintLegend } from '../print/buildPrintLegend'
import type { PrintConfig } from '../print/PrintConfig'

const props = defineProps<{
  config: PrintConfig
  canvas2DImage: string | null
  canvas3DImage: string | null
}>()

const store = useProjectStore()
const settingsStore = useSettingsStore()

const data = computed(() => buildPrintData(store.project, store.activeZone))
const legend = computed(() => store.activeZone ? buildPrintLegend(store.project, store.activeZone) : [])
const today = computed(() => new Date().toLocaleDateString('fr-FR'))

const show2DBlock = computed(() => props.config.show2D && !!props.canvas2DImage)
const show3DBlock = computed(() => props.config.show3D && !!props.canvas3DImage)
const showLegend = computed(() => (show2DBlock.value || show3DBlock.value) && legend.value.length > 0)
const showVisualsRow = computed(() => show3DBlock.value || showLegend.value)

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}
</script>

<template>
  <div class="print-layout print-only">

    <!-- En-tête : entreprise + devis -->
    <template v-if="config.title">
      <div class="print-header" data-testid="print-header">
        <div class="header-top">
          <div class="company-identity">
            <img v-if="settingsStore.companyProfile.logo" :src="settingsStore.companyProfile.logo" class="company-logo" />
            <div v-if="settingsStore.companyProfile.companyName" class="company-name">{{ settingsStore.companyProfile.companyName }}</div>
          </div>
          <div class="devis-title">DEVIS</div>
        </div>
        <div class="header-meta">
          <div class="meta-col">
            <div v-if="settingsStore.companyProfile.contactName">{{ settingsStore.companyProfile.contactName }}</div>
            <div v-if="settingsStore.companyProfile.phone">{{ settingsStore.companyProfile.phone }}</div>
            <div v-if="settingsStore.companyProfile.email">{{ settingsStore.companyProfile.email }}</div>
          </div>
          <div class="meta-col meta-col-right">
            <div>{{ store.project.name }}</div>
            <div>{{ store.activeZone?.name }}</div>
            <div>{{ today }}</div>
          </div>
        </div>
      </div>
      <hr class="header-rule" />
    </template>

    <!-- Vue 2D, pleine largeur -->
    <div v-if="show2DBlock" class="print-section">
      <h3>Plan 2D</h3>
      <img :src="canvas2DImage!" class="print-img-full" />
    </div>

    <!-- Vue 3D + légende -->
    <div v-if="showVisualsRow" class="print-section visuals-row">
      <div v-if="show3DBlock" class="visuals-3d">
        <h3>Vue 3D</h3>
        <img :src="canvas3DImage!" class="print-img" />
      </div>
      <div v-if="showLegend" class="visuals-legend" data-testid="print-legend">
        <h3>Légende</h3>
        <div v-for="row in legend" :key="row.color" class="legend-row">
          <span class="legend-dot" :style="{ background: row.color }" />
          <span class="legend-label">{{ row.ouvrageName }}</span>
        </div>
      </div>
    </div>

    <!-- Récap par ouvrage -->
    <div v-if="config.showRecapOuvrage" class="print-section">
      <h3>Récapitulatif par ouvrage</h3>
      <table class="print-table">
        <thead>
          <tr><th>Ouvrage</th><th>Constituant</th><th>Qté tot.</th><th>Unité</th><th>P.U.</th><th>Total</th></tr>
        </thead>
        <tbody>
          <template v-for="o in data.recapOuvrages" :key="o.ouvrageId">
            <tr class="ouvrage-row">
              <td colspan="5">{{ o.ouvrageName }}</td>
              <td class="num">{{ fmt(o.total) }} €</td>
            </tr>
            <tr v-for="c in o.constituents" :key="c.ouvrageConstituentId">
              <td />
              <td>
                {{ c.name }}
                <span v-if="c.hasError" class="error-icon" title="Formule en erreur sur au moins un tracé">⚠</span>
              </td>
              <td class="num">{{ fmtQty(c.quantity) }}</td>
              <td>{{ c.unit }}</td>
              <td class="num">{{ fmt(c.unitPrice) }} €</td>
              <td class="num">{{ fmt(c.total) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" class="num">Total général</td>
            <td class="num">{{ fmt(data.recapOuvrageTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Devis -->
    <div v-if="config.showDevis" class="print-section" data-testid="devis-section">
      <h3>Devis</h3>
      <table class="print-table">
        <thead>
          <tr><th>Ouvrage</th><th class="num">Prix</th></tr>
        </thead>
        <tbody>
          <tr v-for="l in data.devisLines" :key="l.ouvrageId">
            <td>
              {{ l.ouvrageName }}
              <div v-if="l.description" class="ouvrage-description">{{ l.description }}</div>
            </td>
            <td class="num" style="white-space:nowrap">{{ fmt(l.price) }} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td class="num">Total</td>
            <td class="num" style="white-space:nowrap">{{ fmt(data.devisTotal) }} €</td>
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
          <tr v-for="c in data.recapConstituents" :key="c.constituentId">
            <td>
              {{ c.name }}
              <span v-if="c.hasError" class="error-icon" title="Formule en erreur sur au moins un tracé">⚠</span>
            </td>
            <td>{{ c.supplier ?? '—' }}</td>
            <td class="num">{{ fmtQty(c.quantity) }}</td>
            <td>{{ c.unit }}</td>
            <td class="num">{{ fmt(c.unitPrice) }} €</td>
            <td class="num">{{ fmt(c.total) }} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" class="num">Total général</td>
            <td class="num">{{ fmt(data.recapConstituentTotal) }} €</td>
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
          <template v-for="t in data.traces" :key="t.traceId">
            <tr class="trace-row">
              <td colspan="6">Tracé n°{{ t.traceNumber }} — {{ t.ouvrageName }}</td>
            </tr>
            <tr v-for="c in t.constituents" :key="c.ouvrageConstituentId">
              <td />
              <td>{{ c.name }}</td>
              <td class="num" :title="c.error || undefined">
                <span v-if="c.error" class="error-cell">Erreur</span>
                <span v-else>{{ fmtQty(c.quantity) }}</span>
              </td>
              <td>{{ c.unit }}</td>
              <td class="num">{{ fmt(c.unitPrice) }} €</td>
              <td class="num">{{ fmt(c.total) }} €</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="5" class="num">Sous-total</td>
              <td class="num">{{ fmt(t.subtotal) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" class="num">Total général</td>
            <td class="num">{{ fmt(data.grandTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

  </div>
</template>

<style scoped>
.print-layout {
  --ink: #111111;
  --ink-muted: #666666;
  --rule: #111111;
  --rule-light: #e5e5e5;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 10.5pt;
  color: var(--ink);
}

/* En-tête */
.header-top { display: flex; justify-content: space-between; align-items: flex-end; }
.company-identity { display: flex; flex-direction: column; gap: 4pt; }
.company-logo { max-height: 32pt; max-width: 130pt; }
.company-name { font-size: 13pt; font-weight: 600; }
.devis-title { font-size: 24pt; font-weight: 700; letter-spacing: 2pt; }
.header-meta { display: flex; justify-content: space-between; margin-top: 10pt; font-size: 9pt; color: var(--ink-muted); }
.meta-col { display: flex; flex-direction: column; gap: 1pt; }
.meta-col-right { text-align: right; }
.header-rule { border: none; border-top: 1pt solid var(--rule); margin: 10pt 0 20pt; }

/* Sections */
.print-section { margin-bottom: 22pt; page-break-inside: avoid; }
.print-section h3 {
  font-size: 11pt; font-weight: 600; color: var(--ink);
  letter-spacing: 0.5pt; margin: 0 0 8pt;
}

.print-img-full { display: block; width: 100%; }
.print-img { display: block; width: 100%; }

.visuals-row { display: flex; align-items: flex-start; gap: 24pt; }
.visuals-3d { flex: 1 1 60%; min-width: 0; }
.visuals-legend { flex: 1 1 40%; min-width: 0; }
.legend-row { display: flex; align-items: center; gap: 6pt; padding: 2pt 0; font-size: 9pt; }
.legend-dot { width: 8pt; height: 8pt; border-radius: 50%; flex-shrink: 0; }

/* Tableaux : traits fins, sans fond */
.print-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
.print-table th {
  text-align: left; font-weight: 600; color: var(--ink);
  padding: 4pt 6pt 6pt; border-bottom: 1pt solid var(--rule);
}
.print-table th.num, .print-table td.num { text-align: right; }
.print-table td { padding: 5pt 6pt; border-bottom: 0.5pt solid var(--rule-light); }
.ouvrage-row td { font-weight: 600; border-bottom: none; padding-top: 10pt; }
.trace-row td { font-style: italic; color: var(--ink-muted); border-bottom: none; padding-top: 10pt; }
.subtotal-row td { color: var(--ink-muted); font-style: italic; border-bottom: 0.5pt solid var(--rule-light); }
.total-row td { font-weight: 700; border-top: 1pt solid var(--rule); border-bottom: none; padding-top: 8pt; }
.error-cell { color: #b91c1c; font-style: italic; }
.error-icon { color: #b45309; margin-left: 4px; }
.ouvrage-description { margin-top: 2pt; color: var(--ink-muted); font-size: 8.5pt; white-space: pre-line; }
</style>
