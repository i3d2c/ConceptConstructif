<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { useLibraryStore } from '../stores/libraryStore'
import type { Ouvrage } from '../domain/models/Ouvrage'
import type { Constituent } from '../domain/models/Constituent'
import type { Scope } from './ouvrageLibrary/scope'
import LibraryListPanel from './ouvrageLibrary/LibraryListPanel.vue'
import OuvrageForm from './ouvrageLibrary/OuvrageForm.vue'
import ConstituentForm from './ouvrageLibrary/ConstituentForm.vue'

const store = useProjectStore()
const library = useLibraryStore()
const emit = defineEmits<{ close: [] }>()

onMounted(() => {
  library.loadLibrary()
})

type Tab = 'ouvrages' | 'constituents'
const tab = ref<Tab>('ouvrages')
const editingOuvrage = ref<Ouvrage | null>(null)
const editingConstituent = ref<Constituent | null>(null)
// Bumped on every "+ Nouveau"/selection click so the form remounts and
// discards any unsaved draft — mirrors the previous imperative reset.
const oFormKey = ref(0)
const cFormKey = ref(0)

const sortedOuvrages = computed(() =>
  [...store.project.ouvrages].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
)
const sortedConstituents = computed(() =>
  [...store.project.constituents].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
)

const ouvrageListItems = computed(() =>
  sortedOuvrages.value.map(o => ({ id: o.id, label: o.name, linked: library.ouvrageIds.has(o.id) }))
)
const constituentListItems = computed(() =>
  sortedConstituents.value.map(c => ({ id: c.id, label: c.name, sublabel: c.code, linked: library.constituentIds.has(c.id) }))
)

const defaultConstituentId = computed(() => store.project.constituents[0]?.id ?? '')

// Suggestions autocomplete
const existingUnits = computed(() =>
  [...new Set(store.project.constituents.map(c => c.unit).filter(Boolean))]
)
const existingSuppliers = computed(() =>
  [...new Set(store.project.constituents.map(c => c.supplier).filter((s): s is string => !!s))]
)
const ouvrageCategorySuggestions = computed(() => [
  ...new Set([
    ...store.project.ouvrages.map(o => o.category),
    ...library.ouvrages.map(o => o.category),
  ].filter(Boolean)),
])
const constituentCategorySuggestions = computed(() => [
  ...new Set([
    ...store.project.constituents.map(c => c.category),
    ...library.constituents.map(c => c.category),
  ].filter(Boolean)),
])

function openNewOuvrage() {
  editingOuvrage.value = null
  oFormKey.value++
}

function openEditOuvrage(id: string) {
  const o = store.project.ouvrages.find(o => o.id === id)
  if (!o) return
  editingOuvrage.value = o
  oFormKey.value++
}

async function saveOuvrage(data: Ouvrage, isNew: boolean, scope: Scope) {
  if (scope === 'library') {
    const result = await library.publishOuvrage(data, store.project.constituents)
    if (!result.published) return // défensif : le formulaire bloque déjà ce cas
  }
  if (isNew) store.addOuvrage(data)
  else store.updateOuvrage(data.id, data)
  editingOuvrage.value = store.project.ouvrages.find(o => o.id === data.id) ?? null
}

function deleteOuvrage(id: string) {
  if (!confirm('Supprimer cet ouvrage ?')) return
  store.removeOuvrage(id)
}

function openNewConstituent() {
  editingConstituent.value = null
  cFormKey.value++
}

function openEditConstituent(id: string) {
  const c = store.project.constituents.find(c => c.id === id)
  if (!c) return
  editingConstituent.value = c
  cFormKey.value++
}

async function saveConstituent(data: Constituent, isNew: boolean, scope: Scope) {
  if (scope === 'library') await library.publishConstituent(data)
  if (isNew) store.addConstituent(data)
  else store.updateConstituent(data.id, data)
  editingConstituent.value = store.project.constituents.find(c => c.id === data.id) ?? null
}

function deleteConstituent(id: string) {
  if (!confirm('Supprimer ce constituant ?')) return
  store.removeConstituent(id)
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div class="tabs">
          <button :class="{ active: tab === 'ouvrages' }" @click="tab = 'ouvrages'">Ouvrages</button>
          <button :class="{ active: tab === 'constituents' }" @click="tab = 'constituents'">Constituants</button>
        </div>
        <button class="icon" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">

        <!-- ── OUVRAGES ── -->
        <template v-if="tab === 'ouvrages'">
          <LibraryListPanel
            title="Ouvrages"
            :items="ouvrageListItems"
            :selected-id="editingOuvrage?.id ?? null"
            @create="openNewOuvrage"
            @select="openEditOuvrage"
            @delete="deleteOuvrage"
          />
          <OuvrageForm
            :key="oFormKey"
            :editing-ouvrage="editingOuvrage"
            :constituent-options="sortedConstituents"
            :default-constituent-id="defaultConstituentId"
            :category-suggestions="ouvrageCategorySuggestions"
            :published-constituent-ids="library.constituentIds"
            @save="saveOuvrage"
          />
        </template>

        <!-- ── CONSTITUANTS ── -->
        <template v-else>
          <LibraryListPanel
            title="Constituants"
            :items="constituentListItems"
            :selected-id="editingConstituent?.id ?? null"
            @create="openNewConstituent"
            @select="openEditConstituent"
            @delete="deleteConstituent"
          />
          <ConstituentForm
            :key="cFormKey"
            :editing-constituent="editingConstituent"
            :units="existingUnits"
            :suppliers="existingSuppliers"
            :category-suggestions="constituentCategorySuggestions"
            @save="saveConstituent"
          />
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 500;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 900px; height: 640px;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex; align-items: center;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  padding: 6px 10px; gap: 8px;
}
.tabs { display: flex; gap: 4px; flex: 1; }
.modal-body { display: flex; flex: 1; overflow: hidden; }
</style>
