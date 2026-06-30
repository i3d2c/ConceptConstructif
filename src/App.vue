<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
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

// Refs pour la capture d'impression
const canvasViewRef = ref<InstanceType<typeof CanvasView> | null>(null)
const scene3DRef = ref<InstanceType<typeof Scene3DFloat> | null>(null)

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
  showPrintDialog.value = false

  // Capture 2D avant d'afficher PrintLayout (canvas Konva composite)
  if (config.show2D && canvasViewRef.value) {
    canvas2DSnapshot.value = await canvasViewRef.value.getStageDataURL()
  } else {
    canvas2DSnapshot.value = null
  }

  // Capture 3D : ouvrir le panneau temporairement si nécessaire
  const wasShow3D = show3D.value
  if (config.show3D && !show3D.value) {
    show3D.value = true
    await nextTick()
    await new Promise(r => setTimeout(r, 600)) // Three.js a besoin d'un tick de rendu
  }
  if (config.show3D && scene3DRef.value) {
    canvas3DSnapshot.value = scene3DRef.value.getDataURL()
  } else {
    canvas3DSnapshot.value = null
  }
  if (!wasShow3D) show3D.value = false

  // Affiche PrintLayout avec les données capturées
  printConfig.value = config

  // Attendre le rendu Vue + un tick pour le navigateur
  await nextTick()
  await new Promise(r => setTimeout(r, 200))

  // Effacer PrintLayout après la fermeture du dialog d'impression
  window.addEventListener('afterprint', () => { printConfig.value = null }, { once: true })
  window.print()
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  const lastId = localStorage.getItem('cc_last_project')
  if (lastId) await store.load(lastId)
})
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
        <CanvasView ref="canvasViewRef" />

        <FloatingPanel v-if="show3D" title="Vue 3D" @close="show3D = false">
          <Scene3DFloat ref="scene3DRef" />
        </FloatingPanel>

        <FloatingPanel v-if="showChiffrage" title="Chiffrage" @close="showChiffrage = false">
          <ChiffrageFloat />
        </FloatingPanel>
      </main>
    </div>

    <OuvrageLibraryModal v-if="showOuvrageModal" @close="showOuvrageModal = false" />
    <PrintDialog v-if="showPrintDialog" @print="onPrint" @cancel="showPrintDialog = false" />
  </div>

  <!-- Layout d'impression (masqué à l'écran) -->
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
