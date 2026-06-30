<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()
const containerRef = ref<HTMLDivElement | null>(null)

// Three.js is loaded lazily to avoid bundling weight at startup
let scene3d: { destroy(): void; rebuild(): void } | null = null

onMounted(async () => {
  if (!containerRef.value) return
  const { Scene3D } = await import('../scene3d/Scene3D')
  scene3d = new Scene3D(containerRef.value, store)
  scene3d.rebuild()
})

onUnmounted(() => {
  scene3d?.destroy()
})

watch(
  () => store.activeZone?.traces,
  () => scene3d?.rebuild(),
  { deep: true },
)
</script>

<template>
  <div ref="containerRef" class="scene3d-container" />
</template>

<style scoped>
.scene3d-container { width: 100%; height: 100%; }
</style>
