<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { duplicateZone } from '../domain/services/ZoneDuplicator'

const store = useProjectStore()
const editingZoneId = ref<string | null>(null)
const editingName = ref('')

function addZone() {
  const id = crypto.randomUUID()
  store.addZone({
    id,
    name: `Zone ${store.project.zones.length + 1}`,
    scale: null,
    backgroundImage: null,
    colorAssignments: [],
    traces: [],
  })
}

function dupZone() {
  const active = store.activeZone
  if (!active) return
  const copy = duplicateZone(active, crypto.randomUUID(), `${active.name} (copie)`)
  store.addZone(copy)
}

function removeZone() {
  const active = store.activeZone
  if (!active) return
  if (store.project.zones.length <= 1) {
    alert('Impossible de supprimer la dernière zone.')
    return
  }
  if (!confirm(`Supprimer la zone "${active.name}" ? Cette action peut être annulée avec Ctrl+Z.`)) return
  store.removeZone(active.id)
}

function startRename(zone: { id: string; name: string }, e: MouseEvent) {
  e.stopPropagation()
  editingZoneId.value = zone.id
  editingName.value = zone.name
}

function commitRename(id: string) {
  const name = editingName.value.trim()
  if (name) store.updateZone(id, { name })
  editingZoneId.value = null
}

function onRenameKey(e: KeyboardEvent, id: string) {
  if (e.key === 'Enter') commitRename(id)
  if (e.key === 'Escape') editingZoneId.value = null
}
</script>

<template>
  <div class="zone-section">
    <div class="section-label">Zones</div>

    <div
      v-for="z in store.project.zones"
      :key="z.id"
      class="zone-entry"
      :class="{ active: z.id === store.project.activeZoneId }"
      @click="store.setActiveZone(z.id)"
    >
      <input
        v-if="editingZoneId === z.id"
        class="zone-rename-input"
        v-model="editingName"
        @blur="commitRename(z.id)"
        @keydown="onRenameKey($event, z.id)"
        @click.stop
        autofocus
      />
      <span v-else class="zone-name">{{ z.name }}</span>
      <button class="rename-btn" title="Renommer" @click="startRename(z, $event)">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="11" height="11">
          <path d="M11 2l3 3-8 8H3v-3L11 2z"/>
        </svg>
      </button>
    </div>

    <div class="zone-actions">
      <button title="Nouvelle zone" @click="addZone">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
          <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
        </svg>
      </button>
      <button title="Dupliquer la zone active" @click="dupZone">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
          <rect x="5" y="1" width="9" height="10" rx="1"/>
          <rect x="2" y="5" width="9" height="10" rx="1" fill="var(--surface)" stroke="currentColor"/>
        </svg>
      </button>
      <button title="Supprimer la zone active" @click="removeZone">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
          <polyline points="2,4 14,4"/>
          <path d="M5 4V2h6v2"/>
          <path d="M4 4l1 10h6l1-10"/>
          <line x1="6.5" y1="7" x2="6.5" y2="11"/>
          <line x1="9.5" y1="7" x2="9.5" y2="11"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.zone-entry {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 6px; border-radius: 4px; cursor: pointer; margin-bottom: 2px;
  border: 1px solid transparent; font-size: 12px;
}
.zone-entry:hover { background: var(--surface2); }
.zone-entry.active { border-color: var(--accent); color: var(--accent); }
.zone-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rename-btn {
  padding: 2px 3px; background: none; border: none;
  color: var(--text-muted); cursor: pointer; opacity: 0;
  display: flex; align-items: center;
}
.zone-entry:hover .rename-btn { opacity: 0.6; }
.rename-btn:hover { opacity: 1 !important; }
.zone-rename-input {
  flex: 1; font-size: 12px; padding: 0 2px;
  background: var(--surface2); border: 1px solid var(--accent);
  border-radius: 2px; color: var(--text); outline: none;
  min-width: 0;
}
.zone-actions { display: flex; gap: 4px; margin-top: 6px; }
.zone-actions button { flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px; }
</style>
