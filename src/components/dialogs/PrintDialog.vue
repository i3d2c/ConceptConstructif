<script setup lang="ts">
import { ref } from 'vue'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { PrintConfig } from '../../print/PrintConfig'

const props = withDefaults(defineProps<{
  initialConfig?: PrintConfig
}>(), {
  initialConfig: () => defaultPrintConfig(),
})

const emit = defineEmits<{
  print: [config: PrintConfig]
  cancel: []
}>()

const config = ref<PrintConfig>({ ...props.initialConfig })

type PresetName = 'total' | 'chiffrage' | 'devis'

const presets: Record<PresetName, PrintConfig> = {
  total: {
    title: true, show2D: true, show3D: true,
    showRecapOuvrage: true, showDevis: true,
    showRecapConstituent: true, showList: true,
  },
  chiffrage: {
    title: true, show2D: true, show3D: false,
    showRecapOuvrage: false, showDevis: false,
    showRecapConstituent: true, showList: true,
  },
  devis: {
    title: true, show2D: true, show3D: true,
    showRecapOuvrage: false, showDevis: true,
    showRecapConstituent: false, showList: false,
  },
}

function applyPreset(name: PresetName) {
  config.value = { ...presets[name] }
}

function doPrint() {
  emit('print', { ...config.value })
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <h3>Configuration d'impression</h3>
      <p class="hint">Sélectionnez les éléments à inclure dans le PDF</p>

      <div class="presets">
        <button type="button" data-testid="preset-total" @click="applyPreset('total')">Total</button>
        <button type="button" data-testid="preset-chiffrage" @click="applyPreset('chiffrage')">Chiffrage</button>
        <button type="button" data-testid="preset-devis" @click="applyPreset('devis')">Devis</button>
      </div>

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
          <input type="checkbox" v-model="config.showDevis" />
          Devis
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
.presets { display: flex; gap: 8px; }
.presets button { flex: 1; }
.options { display: flex; flex-direction: column; gap: 8px; }
.checkbox-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; cursor: pointer; color: var(--text);
}
.checkbox-row input { width: auto; cursor: pointer; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
