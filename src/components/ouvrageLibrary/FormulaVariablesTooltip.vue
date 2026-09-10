<script setup lang="ts">
defineProps<{
  visible: boolean
  position: { top: number; left: number }
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="formula-help" :style="{ top: position.top + 'px', left: position.left + 'px' }">
      <slot />
    </div>
  </Teleport>
</template>

<style>
.formula-help {
  position: fixed;
  z-index: 9999;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
.help-grid {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 2px 8px;
}
.hk {
  font-family: monospace;
  font-weight: bold;
  color: var(--accent);
  font-size: 12px;
}
.help-fns { color: var(--text-muted); }
.help-fns code { color: var(--accent); font-family: monospace; }
</style>
