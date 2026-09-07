<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  entityLabel: 'ouvrage' | 'constituant'
}>()

const determiner = computed(() => props.entityLabel === 'ouvrage' ? 'cet' : 'ce')

const emit = defineEmits<{
  discard: []
  cancel: []
}>()
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <h3>Modifications non enregistrées</h3>
      <p>Vous avez des modifications non enregistrées sur {{ determiner }} {{ entityLabel }}. Voulez-vous les abandonner ?</p>
      <div class="dialog-actions">
        <button @click="emit('cancel')">Annuler</button>
        <button class="danger" @click="emit('discard')">Abandonner les modifications</button>
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
  width: 360px;
  display: flex; flex-direction: column; gap: 12px;
}
h3 { font-size: 14px; }
p { font-size: 12px; color: var(--text-muted); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 4px; }
button.danger { background: #7f1d1d; color: #fca5a5; border-color: #991b1b; }
button.danger:hover { background: #991b1b; }
</style>
