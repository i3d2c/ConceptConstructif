<script setup lang="ts">
import { fmt, fmtQty } from '../../print/format'
import type { PrintConstituentRecap } from '../../print/buildPrintData'

defineProps<{
  constituents: PrintConstituentRecap[]
  total: number
}>()
</script>

<template>
  <div class="print-section">
    <h3>Récapitulatif par constituant</h3>
    <table class="print-table">
      <thead>
        <tr><th>CONSTITUANT</th><th>FOURNISSEUR</th><th>QTÉ TOT.</th><th>UNITÉ</th><th>P.U.</th><th>TOTAL</th></tr>
      </thead>
      <tbody>
        <tr v-for="c in constituents" :key="c.constituentId">
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
          <td colspan="5" class="num">TOTAL GÉNÉRAL</td>
          <td class="num">{{ fmt(total) }} €</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
