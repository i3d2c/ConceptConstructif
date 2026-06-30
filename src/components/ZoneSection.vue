<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'
import { duplicateZone } from '../domain/services/ZoneDuplicator'

const store = useProjectStore()

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
      {{ z.name }}
    </div>

    <div class="zone-actions">
      <button title="Nouvelle zone" @click="addZone">+</button>
      <button title="Dupliquer la zone active" @click="dupZone">Dup.</button>
      <button title="Supprimer la zone active" @click="removeZone">X</button>
    </div>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.zone-entry {
  padding: 5px 8px; border-radius: 4px; cursor: pointer; margin-bottom: 2px;
  border: 1px solid transparent; font-size: 12px;
}
.zone-entry:hover { background: var(--surface2); }
.zone-entry.active { border-color: var(--accent); color: var(--accent); }
.zone-actions { display: flex; gap: 4px; margin-top: 6px; }
.zone-actions button { flex: 1; }
</style>
