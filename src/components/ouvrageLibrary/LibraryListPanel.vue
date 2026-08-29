<script setup lang="ts">
import { computed } from 'vue'
import { useCategoryFilter } from './useCategoryFilter'

export interface LibraryListItem {
  id: string
  label: string
  sublabel?: string
  linked: boolean
  category: string
}

const props = defineProps<{
  title: string
  items: LibraryListItem[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  create: []
  browseLibrary: []
}>()

const { categoryFilter, categories, filteredItems } = useCategoryFilter(computed(() => props.items))
</script>

<template>
  <div class="list-col">
    <div class="list-header">
      <span class="list-title">{{ title }}</span>
      <div class="list-header-actions">
        <button @click="emit('browseLibrary')">Bibliothèque</button>
        <button @click="emit('create')">+ Nouveau</button>
      </div>
      <select v-model="categoryFilter" v-if="categories.length > 0">
        <option value="">Toutes catégories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
    <div
      v-for="item in filteredItems" :key="item.id"
      class="list-item"
      :class="{ selected: selectedId === item.id }"
      @click="emit('select', item.id)"
    >
      <div>
        <div>{{ item.label }}</div>
        <div v-if="item.sublabel" class="item-code">{{ item.sublabel }}</div>
        <div class="item-badge" :class="{ linked: item.linked }">{{ item.linked ? 'Bibliothèque' : 'Local' }}</div>
      </div>
      <button class="icon small" @click.stop="emit('delete', item.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.list-col {
  width: 240px; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow-y: auto;
}
.list-header {
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.list-title { font-weight: 600; }
.list-header-actions { display: flex; gap: 6px; }
.list-header-actions button { flex: 1; }
.list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; cursor: pointer; font-size: 12px;
  border-bottom: 1px solid var(--border);
}
.list-item:hover { background: var(--surface2); }
.list-item.selected { background: var(--surface2); border-left: 3px solid var(--accent); }
.item-code { font-size: 10px; color: var(--text-muted); }
.item-badge {
  display: inline-block;
  margin-top: 2px;
  font-size: 9px;
  color: var(--text-muted);
}
.item-badge.linked { color: var(--accent); }
.small { padding: 2px 5px; font-size: 10px; }
</style>
