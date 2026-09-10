<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { OuvrageConstituent } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import { findForwardReferences } from '../../domain/services/FormulaEvaluator'
import { prefillFormula } from '../../domain/services/ConstituentFormulaPrefill'
import ConstituentCombobox from './ConstituentCombobox.vue'

const props = defineProps<{
  oc: OuvrageConstituent
  constituentOptions: Constituent[]
  isDragging: boolean
}>()

const emit = defineEmits<{
  remove: []
  toggleFlags: [id: string, event: MouseEvent]
  dragstart: []
  dragover: [pointerRatio: number]
  dragend: []
}>()

const flagsCount = computed(() =>
  [props.oc.disabled, props.oc.hideIfZero, props.oc.hideIfPriceZero, props.oc.hideFromRecapOuvrage, props.oc.hideFromRecapConstituent]
    .filter(Boolean).length
)

const forwardReferences = computed(() => findForwardReferences(props.oc.formula, props.oc.position))

watch(() => props.oc.constituentId, () => {
  const newConstituent = props.constituentOptions.find(c => c.id === props.oc.constituentId)
  props.oc.formula = prefillFormula(props.oc.formula, newConstituent)
})

const rowRef = ref<HTMLElement | null>(null)
const comboboxRef = ref<InstanceType<typeof ConstituentCombobox> | null>(null)

defineExpose({ focusConstituent: () => comboboxRef.value?.focus() })

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    if (rowRef.value) e.dataTransfer.setDragImage(rowRef.value, 20, 16)
    e.dataTransfer.effectAllowed = 'move'
  }
  emit('dragstart')
}

function onDragOver(e: DragEvent) {
  if (!rowRef.value) return
  const rect = rowRef.value.getBoundingClientRect()
  emit('dragover', (e.clientY - rect.top) / rect.height)
}
</script>

<template>
  <div
    ref="rowRef"
    class="oc-row"
    :class="{ 'oc-row--dragging': isDragging }"
    @dragover.prevent="onDragOver"
    @drop.prevent="emit('dragend')"
  >
    <span
      class="oc-drag-handle"
      draggable="true"
      title="Glisser pour réordonner"
      @dragstart="onDragStart"
      @dragend="emit('dragend')"
    >⠿</span>
    <span class="oc-pos">C{{ oc.position }}</span>
    <ConstituentCombobox ref="comboboxRef" v-model="oc.constituentId" :constituent-options="constituentOptions" />
    <div class="oc-formulas">
      <input v-model="oc.formula" placeholder="ex: L*H/(0.22*0.05)" title="Formule par tracé" />
      <span v-if="forwardReferences.length > 0" class="oc-formula-warning">
        ⚠ référence en avant invalide : {{ forwardReferences.map(n => `C${n}`).join(', ') }}
      </span>
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
.oc-row--dragging { opacity: 0.4; }
.oc-drag-handle { cursor: grab; color: var(--text-muted); flex-shrink: 0; user-select: none; }
.oc-formulas { display: flex; flex-direction: column; gap: 3px; flex: 3; }
.oc-formulas input { font-size: 11px; }
.oc-formula-warning { font-size: 10px; color: #f59e0b; }
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
