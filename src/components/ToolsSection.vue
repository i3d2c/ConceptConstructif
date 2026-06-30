<script setup lang="ts">
import { ref, provide } from 'vue'

export type DrawMode = 'scale' | 'line' | 'surface' | 'select'

const mode = ref<DrawMode>('select')

provide('drawMode', mode)
</script>

<template>
  <div class="tools-section">
    <div class="section-label">Outils</div>
    <div class="tool-btns">
      <button :class="{ active: mode === 'scale' }" title="Tracer l'échelle" @click="mode = 'scale'">Echelle</button>
      <button :class="{ active: mode === 'line' }" title="Tracer un trait (mur)" @click="mode = 'line'">Trait</button>
      <button :class="{ active: mode === 'surface' }" title="Tracer une surface" @click="mode = 'surface'">Surface</button>
      <button :class="{ active: mode === 'select' }" title="Sélectionner" @click="mode = 'select'">Select.</button>
    </div>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.tool-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.tool-btns button { padding: 6px 4px; }
</style>
