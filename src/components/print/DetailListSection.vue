<script setup lang="ts">
import { fmt, fmtQty } from '../../print/format'
import type { PrintTraceDetail } from '../../print/buildPrintData'

defineProps<{
  traces: PrintTraceDetail[]
  total: number
}>()
</script>

<template>
  <div class="print-section table-section">
    <h3>Liste détaillée par tracé</h3>
    <table class="print-table">
      <thead>
        <tr><th>N°</th><th>CONSTITUANT</th><th>QTÉ</th><th>UNITÉ</th><th>P.U.</th><th>TOTAL</th></tr>
      </thead>
      <tbody>
        <template v-for="t in traces" :key="t.traceId">
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
          <td colspan="5" class="num">TOTAL GÉNÉRAL</td>
          <td class="num">{{ fmt(total) }} €</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
