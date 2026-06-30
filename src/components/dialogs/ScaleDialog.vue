<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [realLength: number]
  cancel: []
}>()

const value = ref('5')

function submit() {
  const n = parseFloat(value.value.replace(',', '.'))
  if (isNaN(n) || n <= 0) return
  emit('confirm', n)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <h3>Longueur réelle du trait</h3>
      <label>Longueur (m)</label>
      <input v-model="value" type="text" autofocus @keyup.enter="submit" />
      <div class="dialog-actions">
        <button @click="emit('cancel')">Annuler</button>
        <button class="active" @click="submit">Valider</button>
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
  width: 280px;
  display: flex; flex-direction: column; gap: 10px;
}
h3 { font-size: 14px; margin-bottom: 4px; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
