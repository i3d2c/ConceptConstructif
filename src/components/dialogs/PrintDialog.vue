<script setup lang="ts">
import { ref } from 'vue'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { PrintConfig } from '../../print/PrintConfig'

const emit = defineEmits<{
  print: [config: PrintConfig]
  cancel: []
}>()

const config = ref<PrintConfig>(defaultPrintConfig())

function doPrint() {
  emit('print', { ...config.value })
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <h3>Configuration d'impression</h3>
      <p class="hint">Sélectionnez les éléments à inclure dans le PDF</p>

      <div class="options">
        <label class="checkbox-row">
          <input type="checkbox" v-model="config.title" />
          Titre du projet et de la zone
        </label>
        <label class="checkbox-row">
          <input type="checkbox" v-model="config.show2D" />
          Vue 2D (capture du plan)
        </label>
        <label class="checkbox-row">
          <input type="checkbox" v-model="config.show3D" />
          Vue 3D
        </label>
        <hr class="divider" />
        <label class="checkbox-row">
          <input type="checkbox" v-model="config.showRecapOuvrage" />
          Récapitulatif par ouvrage
        </label>
        <label class="checkbox-row">
          <input type="checkbox" v-model="config.showRecapConstituent" />
          Récapitulatif par constituant
        </label>
        <hr class="divider" />
        <label class="checkbox-row">
          <input type="checkbox" v-model="config.showList" />
          Liste détaillée par tracé
        </label>
      </div>

      <div class="dialog-actions">
        <button @click="emit('cancel')">Annuler</button>
        <button class="active" @click="doPrint">Imprimer / PDF</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  width: 320px;
  display: flex; flex-direction: column; gap: 12px;
}
h3 { font-size: 14px; }
.hint { color: var(--text-muted); font-size: 11px; }
.options { display: flex; flex-direction: column; gap: 8px; }
.checkbox-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; cursor: pointer; color: var(--text);
}
.checkbox-row input { width: auto; cursor: pointer; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
