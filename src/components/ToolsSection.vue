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
    <button
      class="toggle-numbers"
      :class="{ active: store.showNumbers }"
      :title="store.showNumbers ? 'Masquer les numéros' : 'Afficher les numéros'"
      @click="store.showNumbers = !store.showNumbers"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
        <text x="1" y="12" font-size="11" font-family="monospace">#</text>
      </svg>
      Numéros
    </button>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.tool-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.tool-btns button { padding: 6px 4px; }
.toggle-numbers {
  width: 100%;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
  opacity: 0.6;
  font-size: 11px;
  padding: 4px;
}
.toggle-numbers.active { opacity: 1; }
</style>
