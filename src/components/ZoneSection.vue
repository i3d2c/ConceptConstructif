<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()
const editingName = ref(store.activeZone?.name ?? '')

watch(() => store.activeZone?.id, () => {
  editingName.value = store.activeZone?.name ?? ''
})

function commitRename() {
  const name = editingName.value.trim()
  if (name) {
    store.updateZone(store.activeZone!.id, { name })
  } else {
    editingName.value = store.activeZone?.name ?? ''
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitRename()
  if (e.key === 'Escape') editingName.value = store.activeZone?.name ?? ''
}
</script>

<template>
  <div class="zone-section">
    <input
      class="zone-name-input"
      v-model="editingName"
      title="Nom de la zone (cliquez pour renommer)"
      @blur="commitRename"
      @keydown="onKeydown"
    />
  </div>
</template>

<style scoped>
.zone-section {
  flex-shrink: 0;
}
.zone-name-input {
  font-size: 13px;
  font-weight: 500;
}
</style>
