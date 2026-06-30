<script setup lang="ts">
import { ref } from 'vue'
import type { ColorAssignment } from '../../domain/models/Zone'
import type { Ouvrage } from '../../domain/models/Ouvrage'

const props = defineProps<{
  initial: ColorAssignment | null
  ouvrages: Ouvrage[]
}>()

const emit = defineEmits<{
  save: [ca: ColorAssignment]
  cancel: []
}>()

const color = ref(props.initial?.color ?? '#ff6600')
const ouvrageId = ref(props.initial?.ouvrageId ?? props.ouvrages[0]?.id ?? '')
const epaisseur = ref(props.initial?.epaisseur ?? 0.105)
const hauteur = ref(props.initial?.hauteur ?? 2.5)
const defaultAngle = ref(props.initial?.defaultAngle ?? 0)

function onOuvrageChange() {
  const o = props.ouvrages.find(o => o.id === ouvrageId.value)
  if (!o) return
  if (o.defaultEpaisseur !== undefined) epaisseur.value = o.defaultEpaisseur
  if (o.defaultHauteur !== undefined) hauteur.value = o.defaultHauteur
}

function submit() {
  if (!ouvrageId.value) return
  emit('save', {
    id: props.initial?.id ?? crypto.randomUUID(),
    color: color.value,
    ouvrageId: ouvrageId.value,
    epaisseur: epaisseur.value,
    hauteur: hauteur.value,
    defaultAngle: defaultAngle.value || undefined,
  })
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <h3>{{ initial ? 'Modifier' : 'Nouvelle' }} assignation</h3>

      <div class="field">
        <label>Couleur</label>
        <input type="color" v-model="color" style="height:32px; padding:2px;" />
      </div>

      <div class="field">
        <label>Ouvrage</label>
        <select v-model="ouvrageId" @change="onOuvrageChange">
          <option v-for="o in ouvrages" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
        <div v-if="ouvrages.length === 0" class="warn">Aucun ouvrage. Créez-en d'abord via "Ouvrages".</div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>E — Épaisseur (m)</label>
          <input type="number" v-model.number="epaisseur" step="0.01" min="0.001" />
        </div>
        <div class="field">
          <label>H — Hauteur (m)</label>
          <input type="number" v-model.number="hauteur" step="0.1" min="0" />
        </div>
      </div>

      <div class="field">
        <label>Angle surface par défaut (°)</label>
        <input type="number" v-model.number="defaultAngle" step="1" min="0" max="89" />
      </div>

      <div class="dialog-actions">
        <button @click="emit('cancel')">Annuler</button>
        <button class="active" :disabled="!ouvrageId" @click="submit">Valider</button>
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
  width: 340px;
  display: flex; flex-direction: column; gap: 12px;
}
h3 { font-size: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-row { display: flex; gap: 10px; }
.field-row .field { flex: 1; }
.warn { font-size: 11px; color: #f59e0b; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
