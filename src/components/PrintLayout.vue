<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { useSettingsStore } from '../stores/settingsStore'
import { buildPrintData } from '../print/buildPrintData'
import { buildPrintLegend } from '../print/buildPrintLegend'
import { buildDevisNumber } from '../print/buildDevisNumber'
import type { PrintConfig } from '../print/PrintConfig'
import DevisSection from './print/DevisSection.vue'
import RecapOuvrageSection from './print/RecapOuvrageSection.vue'
import RecapConstituentSection from './print/RecapConstituentSection.vue'
import DetailListSection from './print/DetailListSection.vue'

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
const devisNumber = computed(() => buildDevisNumber(new Date()))

const logoLayout = computed<'side' | 'stacked'>(() => {
  const ratio = settingsStore.companyProfile.logoAspectRatio
  if (!settingsStore.companyProfile.logo || ratio === null) return 'stacked'
  return ratio <= 2 ? 'side' : 'stacked'
})

const show2DBlock = computed(() => props.config.show2D && !!props.canvas2DImage)
const show3DBlock = computed(() => props.config.show3D && !!props.canvas3DImage)
const showLegend = computed(() => (show2DBlock.value || show3DBlock.value) && legend.value.length > 0)
const showVisualsRow = computed(() => show3DBlock.value || showLegend.value)
const showPlansPage = computed(() => show2DBlock.value || show3DBlock.value)

type PrimaryTable = 'devis' | 'recapOuvrage' | 'recapConstituent' | null
const primaryTable = computed<PrimaryTable>(() => {
  if (props.config.showDevis) return 'devis'
  if (props.config.showRecapOuvrage) return 'recapOuvrage'
  if (props.config.showRecapConstituent) return 'recapConstituent'
  return null
})

const showRecapOuvrageInTrailing = computed(() => primaryTable.value !== 'recapOuvrage' && props.config.showRecapOuvrage)
const showRecapConstituentInTrailing = computed(() => primaryTable.value !== 'recapConstituent' && props.config.showRecapConstituent)
const showListInTrailing = computed(() => props.config.showList)
const showTrailingContent = computed(() =>
  showRecapOuvrageInTrailing.value || showRecapConstituentInTrailing.value || showListInTrailing.value,
)
</script>

<template>
  <div class="print-layout print-only">

    <template v-if="config.title">
      <div class="print-header" data-testid="print-header">
        <div class="company-block" :class="`layout-${logoLayout}`" data-testid="company-block">
          <img v-if="settingsStore.companyProfile.logo" :src="settingsStore.companyProfile.logo" class="company-logo" />
          <div class="company-info">
            <div v-if="settingsStore.companyProfile.companyName" class="company-name">{{ settingsStore.companyProfile.companyName }}</div>
            <div v-if="settingsStore.companyProfile.contactName">{{ settingsStore.companyProfile.contactName }}</div>
            <div v-if="settingsStore.companyProfile.phone">{{ settingsStore.companyProfile.phone }}</div>
            <div v-if="settingsStore.companyProfile.email">{{ settingsStore.companyProfile.email }}</div>
          </div>
        </div>
        <hr class="header-rule" />
        <div class="devis-meta">
          <div class="devis-title">DEVIS {{ devisNumber }}</div>
          <div class="chantier-info">
            <div>{{ store.project.name }}</div>
            <div>{{ store.activeZone?.name }}</div>
            <div>{{ today }}</div>
          </div>
        </div>
        <hr class="header-rule" />
      </div>
    </template>

    <div v-if="primaryTable" class="primary-content" data-testid="primary-content">
      <DevisSection v-if="primaryTable === 'devis'" :lines="data.devisLines" :total="data.devisTotal" />
      <RecapOuvrageSection v-if="primaryTable === 'recapOuvrage'" :ouvrages="data.recapOuvrages" :total="data.recapOuvrageTotal" />
      <RecapConstituentSection v-if="primaryTable === 'recapConstituent'" :constituents="data.recapConstituents" :total="data.recapConstituentTotal" />
    </div>

    <div v-if="showPlansPage" class="plans-page" data-testid="plans-page" style="page-break-before: always">
      <div v-if="show2DBlock" class="print-section">
        <h3>PLAN 2D</h3>
        <hr class="header-rule" />
        <img :src="canvas2DImage!" class="print-img-full" />
      </div>

      <div v-if="showVisualsRow" class="print-section visuals-row">
        <div v-if="show3DBlock" class="visuals-3d">
          <h3>VUE 3D</h3>
          <hr class="header-rule" />
          <img :src="canvas3DImage!" class="print-img" />
        </div>
        <div v-if="showLegend" class="visuals-legend" data-testid="print-legend">
          <h3>Légende</h3>
          <hr class="header-rule" />
          <div v-for="row in legend" :key="row.color" class="legend-row">
            <span class="legend-dot" :style="{ background: row.color }" />
            <span class="legend-label">{{ row.ouvrageName }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showTrailingContent" class="trailing-content" data-testid="trailing-content" style="page-break-before: always">
      <RecapOuvrageSection v-if="showRecapOuvrageInTrailing" :ouvrages="data.recapOuvrages" :total="data.recapOuvrageTotal" />
      <RecapConstituentSection v-if="showRecapConstituentInTrailing" :constituents="data.recapConstituents" :total="data.recapConstituentTotal" />
      <DetailListSection v-if="showListInTrailing" :traces="data.traces" :total="data.grandTotal" />
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

/* En-tête : bloc entreprise */
.company-block { display: flex; gap: 4mm; }
.company-block.layout-side { align-items: flex-start; }
.company-block.layout-side .company-logo { max-width: 50%; max-height: 30mm; }
.company-block.layout-side .company-info { columns: 2; column-fill: auto; max-height: 30mm; column-gap: 8pt; }
.company-block.layout-stacked { flex-direction: column; align-items: flex-start; }
.company-block.layout-stacked .company-logo { max-width: 66.67%; }
.company-block.layout-stacked .company-info { columns: 2; column-gap: 16pt; }
.company-name { font-size: 13pt; font-weight: 600; }
.header-rule { border: none; border-top: 1pt solid var(--rule); margin: 10pt 0; }

/* En-tête : devis + chantier */
.devis-meta { text-align: right; }
.devis-title { font-size: 24pt; font-weight: 700; letter-spacing: 2pt; }
.chantier-info { margin-top: 6pt; font-size: 9pt; color: var(--ink-muted); }

/* Sections */
.print-section { margin-bottom: 22pt; page-break-inside: avoid; }
.print-section h3 {
  font-size: 11pt; font-weight: 600; color: var(--ink);
  letter-spacing: 0.5pt; margin: 0 0 8pt;
}

.plans-page { page-break-inside: avoid; }
.print-img-full { display: block; width: 100%; max-height: 135mm; object-fit: contain; }
.print-img { display: block; width: 100%; max-height: 90mm; object-fit: contain; }

.visuals-row { display: flex; align-items: flex-start; gap: 24pt; }
.visuals-3d { flex: 1 1 60%; min-width: 0; }
.visuals-legend { flex: 1 1 40%; min-width: 0; columns: 2; column-gap: 12pt; column-fill: auto; }
.visuals-legend h3, .visuals-legend hr { column-span: all; }
.legend-row { display: flex; align-items: center; gap: 6pt; padding: 2pt 0; font-size: 9pt; break-inside: avoid; }
.legend-dot {
  width: 8pt; height: 8pt; border-radius: 50%; flex-shrink: 0;
  /* Browsers strip background colors when printing unless "background graphics" is
     explicitly enabled - force it since the legend's whole point is the color. */
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
</style>

<style>
/* Unscoped: shared by the table subcomponents rendered inside .primary-content / .trailing-content */
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
