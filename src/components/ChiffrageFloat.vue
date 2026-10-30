<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { buildPrintData } from '../print/buildPrintData'

const store = useProjectStore()
const tab = ref<'list' | 'ouvrage' | 'devis' | 'constituent'>('list')

const data = computed(() => buildPrintData(store.project, store.activeZone ? [store.activeZone] : []))

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
      <button :class="{ active: tab === 'devis' }" @click="tab = 'devis'">Devis</button>
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
          <template v-for="t in data.traces" :key="t.traceId">
            <tr class="trace-header">
              <td colspan="6">
                ▶ Tracé n°{{ t.traceNumber }} — {{ t.ouvrageName }}
                (L={{ fmtQty(t.vars.L) }}m · H={{ fmtQty(t.vars.H) }}m · E={{ fmtQty(t.vars.E) }}m)
              </td>
            </tr>
            <tr v-for="c in t.constituents" :key="c.ouvrageConstituentId">
                <td />
                <td>
                  <a v-if="c.url" :href="c.url" target="_blank" rel="noopener">{{ c.name }}</a>
                  <span v-else>{{ c.name }}</span>
                </td>
                <td class="num" :title="c.error || undefined">
                  <span v-if="c.error" class="error-cell">⚠ Erreur formule</span>
                  <span v-else>{{ fmtQty(c.quantity) }}</span>
                </td>
                <td>{{ c.unit }}</td>
                <td class="num">{{ fmt(c.unitPrice) }} €</td>
                <td class="num">{{ fmt(c.total) }} €</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="5" class="right">Sous-total</td>
              <td class="num">{{ fmt(t.subtotal) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right grand">Total général</td>
            <td class="num grand">{{ fmt(data.grandTotal) }} €</td>
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
          <template v-for="o in data.recapOuvrages" :key="o.ouvrageId">
            <tr class="ouvrage-header">
              <td colspan="5">{{ o.ouvrageName }}</td>
              <td class="num">{{ fmt(o.total) }} €</td>
            </tr>
            <tr v-for="c in o.constituents" :key="c.ouvrageConstituentId">
              <td />
              <td>
                {{ c.name }}
                <span v-if="c.hasError" class="error-icon" title="Une formule de ce constituant est en erreur sur au moins un tracé">⚠</span>
              </td>
              <td class="num">{{ fmtQty(c.quantity) }}</td>
              <td>{{ c.unit }}</td>
              <td class="num">{{ fmt(c.unitPrice) }} €</td>
              <td class="num">{{ fmt(c.total) }} €</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right grand">Total général</td>
            <td class="num grand">{{ fmt(data.recapOuvrageTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Onglet 3 : devis -->
    <div v-else-if="tab === 'devis'" class="scroll-body" data-testid="devis-panel">
      <table>
        <thead>
          <tr><th>Ouvrage</th><th class="num">Prix</th></tr>
        </thead>
        <tbody>
          <tr v-for="line in data.devisLines" :key="line.ouvrageId">
            <td>
              {{ line.ouvrageName }}
              <div v-if="line.description" class="ouvrage-description">{{ line.description }}</div>
            </td>
            <td class="num">{{ fmt(line.price) }} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="right grand">Total</td>
            <td class="num grand">{{ fmt(data.devisTotal) }} €</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Onglet 4 : récap par constituant -->
    <div v-else-if="tab === 'constituent'" class="scroll-body">
      <table>
        <thead>
          <tr><th>Constituant</th><th>Fournisseur</th><th class="num">Qté tot.</th><th>Unité</th><th class="num">P.U.</th><th class="num">Total</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in data.recapConstituents" :key="c.constituentId">
            <td>
              <a v-if="c.url" :href="c.url" target="_blank" rel="noopener">{{ c.name }}</a>
              <span v-else>{{ c.name }}</span>
              <span v-if="c.hasError" class="error-icon" title="Une formule de ce constituant est en erreur sur au moins un tracé">⚠</span>
            </td>
            <td>{{ c.supplier ?? '—' }}</td>
            <td class="num">{{ fmtQty(c.quantity) }}</td>
            <td>{{ c.unit }}</td>
            <td class="num">{{ fmt(c.unitPrice) }} €</td>
            <td class="num">{{ fmt(c.total) }} €</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right grand">Total général</td>
            <td class="num grand">{{ fmt(data.recapConstituentTotal) }} €</td>
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
.num { text-align: right; white-space: nowrap; }
.right { text-align: right; }
.trace-header td { background: rgba(255,255,255,0.04); color: var(--text-muted); font-style: italic; padding: 4px 6px; }
.ouvrage-header td { background: rgba(255,255,255,0.06); font-weight: 600; }
.subtotal-row td { color: var(--text-muted); font-size: 10px; }
.grand { font-weight: 700; font-size: 12px; }
a { color: #60a5fa; }
.error-cell { color: #f87171; font-style: italic; }
.error-icon { color: #f59e0b; margin-left: 4px; cursor: help; }
.ouvrage-description { margin-left: 12px; color: var(--text-muted); font-size: 10px; white-space: pre-line; }
</style>
