<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import SidebarLeft from './components/SidebarLeft.vue'
import CanvasView from './components/CanvasView.vue'
import FloatingPanel from './components/FloatingPanel.vue'
import ChiffrageFloat from './components/ChiffrageFloat.vue'
import Scene3DFloat from './components/Scene3DFloat.vue'
import OuvrageLibraryModal from './components/OuvrageLibraryModal.vue'
import { useProjectStore } from './stores/projectStore'
import { ref } from 'vue'

const store = useProjectStore()
const show3D = ref(false)
const showChiffrage = ref(false)
const showOuvrageModal = ref(false)

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault()
    store.redo()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app-layout no-print">
    <AppHeader
      :show3d="show3D"
      :show-chiffrage="showChiffrage"
      @toggle3d="show3D = !show3D"
      @toggle-chiffrage="showChiffrage = !showChiffrage"
    />

    <div class="app-body">
      <SidebarLeft
        @open-ouvrages="showOuvrageModal = true"
        @toggle3d="show3D = !show3D"
        @toggle-chiffrage="showChiffrage = !showChiffrage"
      />

      <main class="canvas-area">
        <CanvasView />

        <FloatingPanel v-if="show3D" title="Vue 3D" @close="show3D = false">
          <Scene3DFloat />
        </FloatingPanel>

        <FloatingPanel v-if="showChiffrage" title="Chiffrage" @close="showChiffrage = false">
          <ChiffrageFloat />
        </FloatingPanel>
      </main>
    </div>

    <OuvrageLibraryModal v-if="showOuvrageModal" @close="showOuvrageModal = false" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #111122;
}
</style>
