<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const x = ref(80)
const y = ref(80)
const w = ref(580)
const h = ref(400)
let dragging = false
let resizing = false
let startX = 0, startY = 0, startW = 0, startH = 0

function startDrag(e: MouseEvent) {
  dragging = true
  startX = e.clientX - x.value
  startY = e.clientY - y.value
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragging) return
  x.value = e.clientX - startX
  y.value = e.clientY - startY
}

function stopDrag() {
  dragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

function startResize(e: MouseEvent) {
  resizing = true
  startX = e.clientX
  startY = e.clientY
  startW = w.value
  startH = h.value
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

function onResize(e: MouseEvent) {
  if (!resizing) return
  w.value = Math.max(300, startW + e.clientX - startX)
  h.value = Math.max(200, startH + e.clientY - startY)
}

function stopResize() {
  resizing = false
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}
</script>

<template>
  <div
    ref="panelRef"
    class="floating-panel"
    :style="{ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }"
  >
    <div class="panel-header" @mousedown="startDrag">
      <span class="panel-title">{{ title }}</span>
      <button class="icon close-btn" @click="emit('close')" @mousedown.stop>X</button>
    </div>
    <div class="panel-body">
      <slot />
    </div>
    <div class="resize-handle" @mousedown="startResize" />
  </div>
</template>

<style scoped>
.floating-panel {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  z-index: 100;
  min-width: 300px;
  min-height: 200px;
}
.panel-header {
  display: flex;
  align-items: center;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  padding: 6px 10px;
  cursor: move;
  user-select: none;
}
.panel-title { flex: 1; font-size: 12px; font-weight: 600; }
.close-btn { margin-left: 8px; }
.panel-body { flex: 1; overflow: auto; }
.resize-handle {
  position: absolute;
  bottom: 0; right: 0;
  width: 16px; height: 16px;
  cursor: se-resize;
}
</style>
