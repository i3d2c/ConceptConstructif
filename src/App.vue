<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import SidebarLeft from './components/SidebarLeft.vue'
import CanvasView from './components/CanvasView.vue'
import FloatingPanel from './components/FloatingPanel.vue'
import ChiffrageFloat from './components/ChiffrageFloat.vue'
import Scene3DFloat from './components/Scene3DFloat.vue'
import OuvrageLibraryModal from './components/OuvrageLibraryModal.vue'
import PrintDialog from './components/dialogs/PrintDialog.vue'
import PrintLayout from './components/PrintLayout.vue'
import { useProjectStore } from './stores/projectStore'
import type { PrintConfig } from './print/PrintConfig'

const store = useProjectStore()
const show3D = ref(false)
const showChiffrage = ref(false)
const showOuvrageModal = ref(false)
const showPrintDialog = ref(false)
const printConfig = ref<PrintConfig | null>(null)
const canvas2DSnapshot = ref<string | null>(null)
const canvas3DSnapshot = ref<string | null>(null)

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

async function onPrint(config: PrintConfig) {
  printConfig.value = config
  showPrintDialog.value = false

  // Capture Konva stage
  if (config.show2D) {
    const konvaStage = document.querySelector<HTMLCanvasElement>('#canvas-container canvas')
    canvas2DSnapshot.value = konvaStage?.toDataURL('image/png') ?? null
  }

  // Capture Three.js canvas
  if (config.show3D) {
    const threeCanvas = document.querySelector<HTMLCanvasElement>('.scene3d-container canvas')
    canvas3DSnapshot.value = threeCanvas?.toDataURL('image/png') ?? null
  }

  await new Promise(r => setTimeout(r, 100))
  window.print()
  printConfig.value = null
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
      @print="showPrintDialog = true"
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
    <PrintDialog v-if="showPrintDialog" @print="onPrint" @cancel="showPrintDialog = false" />
  </div>

  <!-- Zone d'impression (cachée à l'écran, visible uniquement @media print) -->
  <PrintLayout
    v-if="printConfig"
    :config="printConfig"
    :canvas2DImage="canvas2DSnapshot"
    :canvas3DImage="canvas3DSnapshot"
  />
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
