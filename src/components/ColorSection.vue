<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import ColorAssignDialog from './dialogs/ColorAssignDialog.vue'
import type { ColorAssignment } from '../domain/models/Zone'

const store = useProjectStore()
const editingCa = ref<ColorAssignment | null>(null)
const showDialog = ref(false)

function selectCa(ca: ColorAssignment) {
  store.setSelectedCaId(ca.id)
}

function openEdit(ca: ColorAssignment, e: MouseEvent) {
  e.stopPropagation()
  editingCa.value = ca
  showDialog.value = true
}

function openNew() {
  editingCa.value = null
  showDialog.value = true
}

function onSave(ca: ColorAssignment) {
  const zone = store.activeZone
  if (!zone) return
  if (editingCa.value) {
    store.updateColorAssignment(zone.id, ca.id, ca)
  } else {
    store.addColorAssignment(zone.id, ca)
    store.setSelectedCaId(ca.id)
  }
  showDialog.value = false
}
</script>

<template>
  <div class="color-section">
    <div class="section-label">Couleurs</div>

    <div
      v-for="ca in store.activeZone?.colorAssignments ?? []"
      :key="ca.id"
      class="color-entry"
      :class="{ selected: store.selectedCaId === ca.id }"
      @click="selectCa(ca)"
    >
      <span class="swatch" :style="{ background: ca.color }" />
      <div class="entry-info">
        <div class="entry-ouvrage">
          {{ store.project.ouvrages.find(o => o.id === ca.ouvrageId)?.name ?? '—' }}
        </div>
        <div class="entry-dim">E={{ ca.epaisseur }}m</div>
      </div>
      <button class="edit-btn" title="Modifier" @click="openEdit(ca, $event)">✎</button>
    </div>

    <button class="add-btn" @click="openNew">+ Couleur</button>

    <ColorAssignDialog
      v-if="showDialog"
      :initial="editingCa"
      :ouvrages="store.project.ouvrages"
      @save="onSave"
      @cancel="showDialog = false"
    />
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.color-entry {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 6px; border-radius: 4px; cursor: pointer; margin-bottom: 3px;
  border: 1px solid var(--border);
}
.color-entry:hover { background: var(--surface2); }
.color-entry.selected { border-color: var(--accent); background: var(--surface2); }
.swatch { width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0; }
.entry-info { flex: 1; overflow: hidden; }
.entry-ouvrage { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entry-dim { font-size: 10px; color: var(--text-muted); }
.edit-btn {
  padding: 2px 5px; font-size: 12px; opacity: 0.5;
  background: none; border: none; cursor: pointer; color: var(--text);
}
.edit-btn:hover { opacity: 1; }
.add-btn { width: 100%; margin-top: 4px; }
</style>
