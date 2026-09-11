<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const emit = defineEmits<{
  importPlan: []
  openOuvrages: []
}>()
</script>

<template>
  <div class="workflow-steps">
    <button data-tour="tour-import-plan" title="Importer un plan" @click="emit('importPlan')">1. Importer un plan</button>
    <button
      data-tour="tour-scale"
      :class="{ active: store.drawMode === 'scale' }"
      title="Définir l'échelle"
      @click="store.setDrawMode('scale')"
    >2. Définir l'échelle</button>
    <button data-tour="tour-ouvrages" title="Ouvrages et constituants" @click="emit('openOuvrages')">3. Ouvrages &amp; Constituants</button>
  </div>
</template>

<style scoped>
.workflow-steps { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
.workflow-steps button { width: 100%; text-align: left; }
</style>
