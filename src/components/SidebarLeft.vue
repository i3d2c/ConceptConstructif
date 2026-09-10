<script setup lang="ts">
import AdBlock from './AdBlock.vue'
import ZoneSection from './ZoneSection.vue'
import WorkflowSteps from './WorkflowSteps.vue'
import ToolsSection from './ToolsSection.vue'
import OptionsSection from './OptionsSection.vue'

defineProps<{
  show3d: boolean
  showChiffrage: boolean
}>()

const emit = defineEmits<{
  importPlan: []
  openOuvrages: []
  toggle3d: []
  toggleChiffrage: []
}>()
</script>

<template>
  <aside class="sidebar no-print">
    <ZoneSection />
    <hr class="divider" />
    <WorkflowSteps @import-plan="emit('importPlan')" @open-ouvrages="emit('openOuvrages')" />
    <hr class="divider" />
    <ToolsSection />
    <hr class="divider" />
    <OptionsSection
      :show3d="show3d"
      :show-chiffrage="showChiffrage"
      @toggle3d="emit('toggle3d')"
      @toggle-chiffrage="emit('toggleChiffrage')"
    />
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
.ad-slot { flex-shrink: 0; margin-top: 8px; }
</style>
