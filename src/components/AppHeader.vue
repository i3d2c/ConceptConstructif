<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { importProject, downloadProject } from '../storage/JsonExporter'

const store = useProjectStore()

defineEmits<{
  toggle3d: []
  toggleChiffrage: []
  print: []
  openProjects: []
}>()

const savedMsg = ref(false)

async function handleSave() {
  await store.save()
  savedMsg.value = true
  setTimeout(() => { savedMsg.value = false }, 2000)
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
    <span class="brand">CC</span>
    <input
      v-model="store.project.name"
      class="project-name"
      title="Nom du projet (cliquez pour renommer)"
    />

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
      <button class="icon save-btn" title="Sauvegarder" @click="handleSave">
        <span v-if="savedMsg" class="saved-msg">✓ Sauvegardé</span>
        <span v-else>💾</span>
      </button>
      <button class="icon" title="Mes projets" @click="$emit('openProjects')">📁</button>
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
.brand { font-weight: 700; color: var(--accent); white-space: nowrap; font-size: 13px; }
.project-name {
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text);
  padding: 2px 6px;
  width: 180px;
  transition: border-color 0.15s;
}
.project-name:hover { border-color: var(--border); }
.project-name:focus { border-color: var(--accent); outline: none; background: var(--surface2); }
.zone-selector select { width: 180px; }
.header-actions { margin-left: auto; display: flex; gap: 4px; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
.save-btn { min-width: 28px; }
.saved-msg { font-size: 11px; color: #4ade80; white-space: nowrap; padding: 0 4px; }
</style>
