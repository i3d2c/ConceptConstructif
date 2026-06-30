<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()
</script>

<template>
  <div class="tools-section">
    <div class="section-label">Outils</div>
    <div class="tool-btns">
      <button :class="{ active: store.drawMode === 'scale' }" title="Tracer l'échelle" @click="store.setDrawMode('scale')">Echelle</button>
      <button :class="{ active: store.drawMode === 'line' }" title="Tracer un trait (mur)" @click="store.setDrawMode('line')">Trait</button>
      <button :class="{ active: store.drawMode === 'surface' }" title="Tracer une surface" @click="store.setDrawMode('surface')">Surface</button>
      <button :class="{ active: store.drawMode === 'select' }" title="Sélectionner" @click="store.setDrawMode('select')">Select.</button>
    </div>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.tool-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.tool-btns button { padding: 6px 4px; }
</style>
