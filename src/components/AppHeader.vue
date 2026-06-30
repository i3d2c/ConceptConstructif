<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'
import { importProject, downloadProject } from '../storage/JsonExporter'

const store = useProjectStore()

defineEmits<{
  toggle3d: []
  toggleChiffrage: []
  print: []
}>()

async function handleSave() {
  await store.save()
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const project = importProject(text)
      store.project = project
    } catch {
      alert('Fichier JSON invalide')
    }
  }
  input.click()
}

function handleExport() {
  downloadProject(store.project)
}
</script>

<template>
  <header class="app-header no-print">
    <span class="brand">ConceptConstructif</span>

    <div class="zone-selector">
      <select
        :value="store.project.activeZoneId"
        @change="store.setActiveZone(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="z in store.project.zones" :key="z.id" :value="z.id">
          {{ z.name }}
        </option>
      </select>
    </div>

    <div class="header-actions">
      <button class="icon" title="Annuler (Ctrl+Z)" :disabled="!store.canUndo" @click="store.undo()">↩</button>
      <button class="icon" title="Rétablir (Ctrl+Y)" :disabled="!store.canRedo" @click="store.redo()">↪</button>
      <button class="icon" title="Sauvegarder" @click="handleSave">💾</button>
      <button class="icon" title="Importer JSON" @click="handleImport">📥</button>
      <button class="icon" title="Exporter JSON" @click="handleExport">📤</button>
      <button class="icon" title="Imprimer / PDF" @click="$emit('print')">🖨</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  flex-shrink: 0;
}
.brand { font-weight: 600; color: var(--accent); white-space: nowrap; }
.zone-selector select { width: 200px; }
.header-actions { margin-left: auto; display: flex; gap: 4px; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
