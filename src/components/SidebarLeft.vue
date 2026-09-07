<script setup lang="ts">
import AdBlock from './AdBlock.vue'
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
    <button data-tour="tour-ouvrages" class="full-btn" @click="emit('openOuvrages')">Ouvrages &amp; Constituants</button>
    <div class="bottom-actions">
      <button data-tour="tour-chiffrage" @click="emit('toggleChiffrage')">Chiffrage</button>
      <button data-tour="tour-3d" @click="emit('toggle3d')">3D</button>
    </div>
    <hr class="divider" />
    <ColorSection />
    <div class="ad-slot no-print">
      <AdBlock />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 8px;
}
.full-btn { width: 100%; }
.bottom-actions { display: flex; gap: 6px; margin-top: 6px; }
.bottom-actions button { flex: 1; }
.ad-slot { flex-shrink: 0; margin-top: 8px; }
</style>
