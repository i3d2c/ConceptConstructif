<script setup lang="ts">
import { fmt } from '../../print/format'
import type { PrintDevisLine } from '../../print/buildPrintData'

defineProps<{
  lines: PrintDevisLine[]
  total: number
}>()
</script>

<template>
  <div class="print-section table-section" data-testid="devis-section">
    <table class="print-table">
      <thead>
        <tr><th>OUVRAGE</th><th class="num">PRIX</th></tr>
      </thead>
      <tbody>
        <tr v-for="l in lines" :key="l.ouvrageId">
          <td>
            {{ l.ouvrageName }}
            <div v-if="l.description" class="ouvrage-description">{{ l.description }}</div>
          </td>
          <td class="num" style="white-space:nowrap">{{ fmt(l.price) }} €</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td class="num">TOTAL</td>
          <td class="num" style="white-space:nowrap">{{ fmt(total) }} €</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
