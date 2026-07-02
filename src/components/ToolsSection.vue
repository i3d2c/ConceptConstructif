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
    <label class="switch-row" :title="store.showNumbers ? 'Masquer les numéros' : 'Afficher les numéros'">
      <span class="switch-label">Numéros</span>
      <button
        type="button"
        role="switch"
        :aria-checked="store.showNumbers"
        class="switch"
        :class="{ on: store.showNumbers }"
        @click="store.showNumbers = !store.showNumbers"
      >
        <span class="switch-knob" />
      </button>
    </label>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.tool-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.tool-btns button { padding: 6px 4px; }
.switch-row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 11px; }
.switch-label { color: var(--text); }
.switch {
  position: relative; width: 30px; height: 16px; border-radius: 8px;
  background: var(--surface2); border: 1px solid var(--border);
  padding: 0; cursor: pointer; flex-shrink: 0; transition: background 0.15s;
}
.switch.on { background: var(--accent); border-color: var(--accent); }
.switch-knob {
  position: absolute; top: 1px; left: 1px; width: 12px; height: 12px;
  border-radius: 50%; background: #fff; transition: left 0.15s;
}
.switch.on .switch-knob { left: 15px; }
</style>
