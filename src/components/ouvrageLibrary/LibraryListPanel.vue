<script setup lang="ts">
export interface LibraryListItem {
  id: string
  label: string
  sublabel?: string
  linked: boolean
}

defineProps<{
  title: string
  items: LibraryListItem[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  create: []
}>()
</script>

<template>
  <div class="list-col">
    <div class="list-header">
      <span>{{ title }}</span>
      <button @click="emit('create')">+ Nouveau</button>
    </div>
    <div
      v-for="item in items" :key="item.id"
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
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
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
