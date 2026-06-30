<script setup lang="ts">
import ColorSection from './ColorSection.vue'
import ZoneSection from './ZoneSection.vue'
import ToolsSection from './ToolsSection.vue'

const emit = defineEmits<{
  openOuvrages: []
  toggle3d: []
  toggleChiffrage: []
}>()
</script>

<template>
  <aside class="sidebar no-print">
    <ZoneSection />
    <hr class="divider" />
    <ToolsSection />
    <hr class="divider" />
    <ColorSection />
    <hr class="divider" />
    <button class="full-btn" @click="emit('openOuvrages')">Ouvrages</button>
    <hr class="divider" />
    <div class="bottom-actions">
      <button @click="emit('toggleChiffrage')">Chiffrage</button>
      <button @click="emit('toggle3d')">3D</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 8px;
}
.full-btn { width: 100%; }
.bottom-actions { display: flex; gap: 6px; margin-top: auto; padding-top: 8px; }
.bottom-actions button { flex: 1; }
</style>
