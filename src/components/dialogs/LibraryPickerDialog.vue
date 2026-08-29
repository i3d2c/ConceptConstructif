<script setup lang="ts">
import { ref, computed } from 'vue'

export interface LibraryPickerItem {
  id: string
  label: string
  sublabel?: string
  category: string
  alreadyInProject: boolean
}

const props = defineProps<{
  title: string
  items: LibraryPickerItem[]
}>()

const emit = defineEmits<{
  select: [id: string]
  close: []
}>()

const search = ref('')
const categoryFilter = ref('')

const categories = computed(() =>
  [...new Set(props.items.map(i => i.category))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))
)

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.items
    .filter(i => !categoryFilter.value || i.category === categoryFilter.value)
    .filter(i => !q || i.label.toLowerCase().includes(q) || (i.sublabel?.toLowerCase().includes(q) ?? false))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
})

function pick(item: LibraryPickerItem) {
  if (item.alreadyInProject) return
  emit('select', item.id)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <span>{{ title }}</span>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="dialog-body">
        <div class="filters">
          <input v-model="search" placeholder="Rechercher..." />
          <select v-model="categoryFilter">
            <option value="">Toutes catégories</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div v-if="items.length === 0" class="hint">La bibliothèque est vide.</div>
        <div v-else-if="filteredItems.length === 0" class="hint">Aucun résultat.</div>

        <ul v-else class="picker-list">
          <li
            v-for="item in filteredItems" :key="item.id"
            :class="{ imported: item.alreadyInProject }"
            @click="pick(item)"
          >
            <div class="picker-info">
              <span class="picker-label">{{ item.label }}</span>
              <span class="picker-meta">{{ item.category }}<template v-if="item.sublabel"> · {{ item.sublabel }}</template></span>
            </div>
            <span v-if="item.alreadyInProject" class="imported-tag">Déjà dans le projet</span>
            <button v-else class="active small" @click.stop="pick(item)">Importer</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 900;
}
.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 520px;
  max-height: 70vh;
  display: flex; flex-direction: column;
}
.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 600; font-size: 13px;
  flex-shrink: 0;
}
.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; }
.dialog-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.filters { display: flex; gap: 8px; flex-shrink: 0; }
.filters input { flex: 1; }
.filters select { flex: 0 0 auto; width: auto; }
.hint { font-size: 12px; color: var(--text-muted); padding: 8px 0; }
.picker-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.picker-list li {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  cursor: pointer;
}
.picker-list li:hover:not(.imported) { border-color: var(--accent); }
.picker-list li.imported { opacity: 0.5; cursor: default; }
.picker-info { display: flex; flex-direction: column; gap: 2px; }
.picker-label { font-size: 13px; font-weight: 500; }
.picker-meta { font-size: 10px; color: var(--text-muted); }
.imported-tag { font-size: 11px; color: var(--text-muted); }
.small { padding: 3px 10px; font-size: 11px; }
</style>
