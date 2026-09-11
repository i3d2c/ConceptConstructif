<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { buildPrintData } from '../print/buildPrintData'
import type { PrintConfig } from '../print/PrintConfig'

const props = defineProps<{
  config: PrintConfig
  canvas2DImage: string | null
  canvas3DImage: string | null
}>()

const store = useProjectStore()

const data = computed(() => buildPrintData(store.project, store.activeZone))

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
          <tr><th>Ouvrage</th><th>Constituant</th><th>Qté tot.</th><th>Unité</th><th>P.U.</th><th>Total</th></tr>
        </thead>
        <tbody>
          <template v-for="o in data.recapOuvrages" :key="o.ouvrageId">
            <tr class="ouvrage-row">
              <td colspan="5" style="font-weight:bold">{{ o.ouvrageName }}</td>
              <td style="text-align:right">{{ fmt(o.total) }} €</td>
            </tr>
            <tr v-for="c in o.constituents" :key="c.ouvrageConstituentId">
              <td />
              <td>
                {{ c.name }}
                <span v-if="c.hasError" class="error-icon" title="Formule en erreur sur au moins un tracé">⚠</span>
              </td>
              <td style="text-align:right">{{ fmtQty(c.quantity) }}</td>
              <td>{{ c.unit }}</td>
              <td style="text-align:right">{{ fmt(c.unitPrice) }} €</td>
              <td style="text-align:right">{{ fmt(c.total) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="5" style="text-align:right">Total général</td>
            <td style="text-align:right">{{ fmt(data.recapOuvrageTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Devis -->
    <div v-if="config.showDevis" class="print-section" data-testid="devis-section">
      <h3>Devis</h3>
      <table class="print-table">
        <thead>
          <tr><th>Ouvrage</th><th style="text-align:right">Prix</th></tr>
        </thead>
        <tbody>
          <tr v-for="l in data.devisLines" :key="l.ouvrageId">
            <td>
              {{ l.ouvrageName }}
              <div v-if="l.description" class="ouvrage-description">{{ l.description }}</div>
            </td>
            <td style="text-align:right; white-space:nowrap">{{ fmt(l.price) }} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td style="text-align:right">Total</td>
            <td style="text-align:right; white-space:nowrap">{{ fmt(data.devisTotal) }} €</td>
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
            <td style="text-align:right">{{ fmtQty(c.quantity) }}</td>
            <td>{{ c.unit }}</td>
            <td style="text-align:right">{{ fmt(c.unitPrice) }} €</td>
            <td style="text-align:right">{{ fmt(c.total) }} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="font-weight:bold">
            <td colspan="5" style="text-align:right">Total général</td>
            <td style="text-align:right">{{ fmt(data.recapConstituentTotal) }} €</td>
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
              <td colspan="6">▶ Tracé n°{{ t.traceNumber }} — {{ t.ouvrageName }}</td>
            </tr>
            <tr v-for="c in t.constituents" :key="c.ouvrageConstituentId">
              <td />
              <td>{{ c.name }}</td>
              <td style="text-align:right" :title="c.error || undefined">
                <span v-if="c.error" class="error-cell">⚠ Erreur</span>
                <span v-else>{{ fmtQty(c.quantity) }}</span>
              </td>
              <td>{{ c.unit }}</td>
              <td style="text-align:right">{{ fmt(c.unitPrice) }} €</td>
              <td style="text-align:right">{{ fmt(c.total) }} €</td>
            </tr>
            <tr>
              <td colspan="5" style="text-align:right;font-style:italic">Sous-total</td>
              <td style="text-align:right">{{ fmt(t.subtotal) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align:right;font-weight:bold">Total général</td>
            <td style="text-align:right;font-weight:bold">{{ fmt(data.grandTotal) }} €</td>
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
.error-cell { color: #b91c1c; font-style: italic; }
.error-icon { color: #b45309; margin-left: 4px; }
.ouvrage-description { margin-left: 12px; color: #555; font-size: 9pt; white-space: pre-line; }
</style>
