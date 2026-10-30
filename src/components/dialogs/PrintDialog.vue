<script setup lang="ts">
import { computed, ref } from 'vue'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { PrintConfig } from '../../print/PrintConfig'
import type { ZoneGroup } from '../../domain/models/Project'

const props = withDefaults(defineProps<{
  initialConfig?: PrintConfig
  groups?: ZoneGroup[]
  activeZoneName?: string
}>(), {
  initialConfig: () => defaultPrintConfig(),
  groups: () => [],
  activeZoneName: '',
})

const emit = defineEmits<{
  print: [config: PrintConfig, groupId: string | null]
  cancel: []
}>()

const config = ref<PrintConfig>({ ...props.initialConfig })
const groupId = ref<string | null>(null)
const groupName = computed(() => props.groups.find(g => g.id === groupId.value)?.name)

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
  emit('print', { ...config.value }, groupId.value)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <h3>Configuration d'impression</h3>
      <p class="hint">Sélectionnez les éléments à inclure dans le PDF</p>

      <label v-if="groups.length > 0" class="scope-row">
        Périmètre
        <select data-testid="print-scope" :value="groupId ?? ''" @change="groupId = ($event.target as HTMLSelectElement).value || null">
          <option value="">Zone active ({{ activeZoneName }})</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </label>
      <p v-if="groupName" data-testid="group-scope-hint" class="hint">
        Impression du groupe « {{ groupName }} » : les vues 2D et 3D ne montrent qu'une zone et ne sont pas incluses.
      </p>

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
          <input
            type="checkbox"
            :checked="config.show2D && !groupName"
            :disabled="!!groupName"
            @change="config.show2D = ($event.target as HTMLInputElement).checked"
          />
          Vue 2D (capture du plan)
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            :checked="config.show3D && !groupName"
            :disabled="!!groupName"
            @change="config.show3D = ($event.target as HTMLInputElement).checked"
          />
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
.scope-row { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--text); }
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
