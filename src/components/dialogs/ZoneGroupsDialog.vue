<script setup lang="ts">
import { useProjectStore } from '../../stores/projectStore'
import type { ZoneGroup } from '../../domain/models/Project'

const emit = defineEmits<{ close: [] }>()
const store = useProjectStore()

function addGroup() {
  store.addZoneGroup({
    id: crypto.randomUUID(),
    name: `Groupe ${store.project.zoneGroups.length + 1}`,
    zoneIds: store.project.zones.map(z => z.id),
  })
}

function toggleZone(group: ZoneGroup, zoneId: string, included: boolean) {
  const zoneIds = store.project.zones
    .map(z => z.id)
    .filter(id => (id === zoneId ? included : group.zoneIds.includes(id)))
  store.updateZoneGroup(group.id, { zoneIds })
}

function rename(group: ZoneGroup, e: Event) {
  const name = (e.target as HTMLInputElement).value.trim()
  if (name) store.updateZoneGroup(group.id, { name })
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <h3>Groupes de zones</h3>
      <p class="hint">Un groupe cumule le chiffrage de plusieurs zones (ex. « Maison complète » = RDC + Annexe).</p>

      <div v-for="group in store.project.zoneGroups" :key="group.id" class="group">
        <div class="group-header">
          <input
            data-testid="group-name"
            type="text"
            class="group-name"
            :value="group.name"
            @change="rename(group, $event)"
          />
          <button
            data-testid="remove-group"
            class="danger small"
            title="Supprimer ce groupe (les zones sont conservées)"
            @click="store.removeZoneGroup(group.id)"
          >Supprimer</button>
        </div>
        <label v-for="zone in store.project.zones" :key="zone.id" class="zone-row">
          <input
            :data-testid="`group-zone-${zone.id}`"
            type="checkbox"
            :checked="group.zoneIds.includes(zone.id)"
            @change="toggleZone(group, zone.id, ($event.target as HTMLInputElement).checked)"
          />
          {{ zone.name }}
        </label>
      </div>

      <div class="dialog-actions">
        <button data-testid="add-group" @click="addGroup">+ Nouveau groupe</button>
        <button class="active" data-testid="close" @click="emit('close')">Fermer</button>
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
  width: 400px;
  display: flex; flex-direction: column; gap: 12px;
}
h3 { font-size: 14px; }
.hint { color: var(--text-muted); font-size: 11px; }
.group { display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid var(--border); border-radius: 6px; }
.group-header { display: flex; gap: 8px; align-items: center; }
.group-name { flex: 1; font-size: 12px; font-weight: 600; }
.small { padding: 3px 10px; font-size: 11px; }
button.danger { background: #7f1d1d; color: #fca5a5; border-color: #991b1b; }
.zone-row { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.zone-row input { width: auto; }
.dialog-actions { display: flex; gap: 8px; justify-content: space-between; margin-top: 4px; }
</style>
