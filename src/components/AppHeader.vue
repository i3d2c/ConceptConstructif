<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { useThemeStore } from '../stores/themeStore'
import { useOnboardingTourStore } from '../stores/onboardingTourStore'
import { importProject, downloadProject } from '../storage/JsonExporter'
import { duplicateZone } from '../domain/services/ZoneDuplicator'
import { defaultPrintConfig } from '../print/PrintConfig'

const store = useProjectStore()
const themeStore = useThemeStore()
const tourStore = useOnboardingTourStore()

defineEmits<{
  toggle3d: []
  toggleChiffrage: []
  print: []
  openProjects: []
}>()

const savedMsg = ref(false)
const showZoneMenu = ref(false)
const zoneMenuRef = ref<HTMLDivElement | null>(null)

function onClickOutsideZoneMenu(e: MouseEvent) {
  if (zoneMenuRef.value && !zoneMenuRef.value.contains(e.target as Node)) {
    showZoneMenu.value = false
  }
}
onMounted(() => window.addEventListener('mousedown', onClickOutsideZoneMenu))
onUnmounted(() => window.removeEventListener('mousedown', onClickOutsideZoneMenu))

function addZone() {
  const id = crypto.randomUUID()
  store.addZone({
    id,
    name: `Zone ${store.project.zones.length + 1}`,
    scale: null,
    backgroundImage: null,
    backgroundImageLayout: null,
    colorAssignments: [],
    traces: [],
    printConfig: defaultPrintConfig(),
  })
  showZoneMenu.value = false
}

function dupZone() {
  const active = store.activeZone
  if (active) {
    const copy = duplicateZone(active, crypto.randomUUID(), `${active.name} (copie)`)
    store.addZone(copy)
  }
  showZoneMenu.value = false
}

function removeZone() {
  const active = store.activeZone
  showZoneMenu.value = false
  if (!active) return
  if (store.project.zones.length <= 1) {
    alert('Impossible de supprimer la dernière zone.')
    return
  }
  if (!confirm(`Supprimer la zone "${active.name}" ? Cette action peut être annulée avec Ctrl+Z.`)) return
  store.removeZone(active.id)
}

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
      <div class="zone-menu-wrap" ref="zoneMenuRef">
        <button
          class="icon"
          title="Actions sur la zone"
          @click="showZoneMenu = !showZoneMenu"
        >⋯</button>
        <div v-if="showZoneMenu" class="zone-menu">
          <button title="Nouvelle zone" @click="addZone">+ Nouvelle zone</button>
          <button title="Dupliquer la zone active" @click="dupZone">Dupliquer la zone active</button>
          <button title="Supprimer la zone active" @click="removeZone">Supprimer la zone active</button>
        </div>
      </div>
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
      <button
        class="icon"
        :title="themeStore.theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
        @click="themeStore.toggle()"
      >{{ themeStore.theme === 'dark' ? '☀️' : '🌙' }}</button>
      <button class="icon" title="Imprimer / PDF" @click="$emit('print')">🖨</button>
      <button class="icon" title="Revoir la visite guidée" @click="tourStore.start()">?</button>
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
.zone-selector { display: flex; align-items: center; gap: 4px; }
.zone-selector select { width: 180px; }
.zone-menu-wrap { position: relative; }
.zone-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 20;
  background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  display: flex; flex-direction: column; min-width: 180px; padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.zone-menu button { text-align: left; border: none; background: none; padding: 6px 8px; }
.zone-menu button:hover { background: var(--hover); }
.header-actions { margin-left: auto; display: flex; gap: 4px; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
.save-btn { min-width: 28px; }
.saved-msg { font-size: 11px; color: #4ade80; white-space: nowrap; padding: 0 4px; }
</style>
