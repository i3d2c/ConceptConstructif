<script setup lang="ts">
import { fmt, fmtQty } from '../../print/format'
import type { PrintOuvrageRecap } from '../../print/buildPrintData'

defineProps<{
  ouvrages: PrintOuvrageRecap[]
  total: number
}>()
</script>

<template>
  <div class="print-section table-section">
    <h3>Récapitulatif par ouvrage</h3>
    <table class="print-table">
      <thead>
        <tr><th>OUVRAGE</th><th>CONSTITUANT</th><th>QTÉ TOT.</th><th>UNITÉ</th><th>P.U.</th><th>TOTAL</th></tr>
      </thead>
      <tbody>
        <template v-for="o in ouvrages" :key="o.ouvrageId">
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
          <td colspan="5" class="num">TOTAL GÉNÉRAL</td>
          <td class="num">{{ fmt(total) }} €</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
