<script setup lang="ts">
import { computed } from 'vue'
import type { OuvrageConstituent } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'

const props = defineProps<{
  oc: OuvrageConstituent
  constituentOptions: Constituent[]
}>()

const emit = defineEmits<{
  remove: []
  toggleFlags: [id: string, event: MouseEvent]
}>()

const flagsCount = computed(() =>
  [props.oc.disabled, props.oc.hideIfZero, props.oc.hideIfPriceZero, props.oc.hideFromRecapOuvrage, props.oc.hideFromRecapConstituent]
    .filter(Boolean).length
)
</script>

<template>
  <div class="oc-row">
    <span class="oc-pos">C{{ oc.position }}</span>
    <select v-model="oc.constituentId" style="flex:1">
      <option v-for="c in constituentOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>
    <div class="oc-formulas">
      <input v-model="oc.formula" placeholder="ex: L*H/(0.22*0.05)" title="Formule par tracé" />
    </div>
    <div class="oc-flags-wrap">
      <button
        class="icon small flags-btn"
        title="Options d'affichage"
        @click="emit('toggleFlags', oc.id, $event)"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
          <circle cx="8" cy="3" r="1.3"/>
          <circle cx="8" cy="8" r="1.3"/>
          <circle cx="8" cy="13" r="1.3"/>
        </svg>
        <span v-if="flagsCount > 0" class="flags-badge">{{ flagsCount }}</span>
      </button>
    </div>
    <button class="icon small" @click="emit('remove')">✕</button>
  </div>
</template>

<style scoped>
.oc-row { display: flex; align-items: center; gap: 6px; }
.oc-formulas { display: flex; flex-direction: column; gap: 3px; flex: 3; }
.oc-formulas input { font-size: 11px; }
.oc-pos { width: 24px; text-align: right; color: var(--text-muted); font-size: 11px; flex-shrink: 0; }
.oc-flags-wrap { flex-shrink: 0; }
.flags-btn { position: relative; color: var(--text-muted); }
.flags-badge {
  position: absolute; top: -5px; right: -5px;
  background: #f59e0b; color: #000;
  border-radius: 50%; width: 13px; height: 13px;
  font-size: 8px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; line-height: 1;
}
.small { padding: 2px 5px; font-size: 10px; }
</style>
