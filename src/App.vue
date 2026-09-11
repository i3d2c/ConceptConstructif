<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import SidebarLeft from './components/SidebarLeft.vue'
import SidebarRight from './components/SidebarRight.vue'
import CanvasView from './components/CanvasView.vue'
import FloatingPanel from './components/FloatingPanel.vue'
import ChiffrageFloat from './components/ChiffrageFloat.vue'
import Scene3DFloat from './components/Scene3DFloat.vue'
import OuvrageLibraryModal from './components/OuvrageLibraryModal.vue'
import PrintDialog from './components/dialogs/PrintDialog.vue'
import ProjectListDialog from './components/dialogs/ProjectListDialog.vue'
import WhatsNewDialog from './components/dialogs/WhatsNewDialog.vue'
import CompanySettingsDialog from './components/dialogs/CompanySettingsDialog.vue'
import TourOverlay from './components/onboarding/TourOverlay.vue'
import { useProjectStore } from './stores/projectStore'
import { useWhatsNewStore } from './stores/whatsNewStore'
import { useOnboardingTourStore } from './stores/onboardingTourStore'
import { useSettingsStore } from './stores/settingsStore'
import { capturePrintSnapshot } from './scene3d/capturePrintSnapshot'
import { buildQuoteDocument } from './print/buildQuoteDocument'
import { pdfMake } from './print/pdfSetup'
import type { PrintConfig } from './print/PrintConfig'

const store = useProjectStore()
const whatsNewStore = useWhatsNewStore()
const tourStore = useOnboardingTourStore()
const settingsStore = useSettingsStore()
const show3D = ref(false)
const showChiffrage = ref(false)
const showOuvrageModal = ref(false)
const showPrintDialog = ref(false)
const showProjectDialog = ref(false)
const showWhatsNew = ref(false)
const showSettingsDialog = ref(false)

// Ref pour la capture d'impression du plan 2D
const canvasViewRef = ref<InstanceType<typeof CanvasView> | null>(null)

function onImportPlan() {
  if (store.activeZone?.backgroundImage) {
    if (!confirm('Remplacer le plan actuel par une nouvelle image ?')) return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) canvasViewRef.value?.loadImageFile(file)
  }
  input.click()
}

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
  if (!store.activeZone) return

  store.updateZone(store.activeZone.id, { printConfig: config })

  const canvas2DImage = config.show2D && canvasViewRef.value
    ? await canvasViewRef.value.getStageDataURL()
    : null
  const canvas3DImage = config.show3D ? await capturePrintSnapshot(store) : null

  const doc = buildQuoteDocument({
    project: store.project,
    zone: store.activeZone,
    config,
    companyProfile: settingsStore.companyProfile,
    canvas2DImage,
    canvas3DImage,
  })

  pdfMake.createPdf(doc).open()
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  const lastId = localStorage.getItem('cc_last_project')
  if (lastId) await store.load(lastId)

  await settingsStore.init()

  tourStore.init()
  if (tourStore.shouldShow) {
    tourStore.start()
  } else {
    whatsNewStore.init()
    showWhatsNew.value = whatsNewStore.shouldShow
  }
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
      @open-projects="showProjectDialog = true"
      @open-settings="showSettingsDialog = true"
    />

    <div class="app-body">
      <SidebarLeft
        :show3d="show3D"
        :show-chiffrage="showChiffrage"
        @import-plan="onImportPlan"
        @open-ouvrages="showOuvrageModal = true"
        @toggle3d="show3D = !show3D"
        @toggle-chiffrage="showChiffrage = !showChiffrage"
      />

      <main class="canvas-area">
        <CanvasView ref="canvasViewRef" />

        <FloatingPanel v-if="show3D" title="Vue 3D" @close="show3D = false">
          <Scene3DFloat />
        </FloatingPanel>

        <FloatingPanel v-if="showChiffrage" title="Chiffrage" @close="showChiffrage = false">
          <ChiffrageFloat />
        </FloatingPanel>
      </main>

      <SidebarRight />
    </div>

    <OuvrageLibraryModal v-if="showOuvrageModal" @close="showOuvrageModal = false" />
    <PrintDialog v-if="showPrintDialog" :initial-config="store.activeZone?.printConfig" @print="onPrint" @cancel="showPrintDialog = false" />
    <ProjectListDialog v-if="showProjectDialog" @close="showProjectDialog = false" />
    <WhatsNewDialog v-if="showWhatsNew" @close="whatsNewStore.markSeen(); showWhatsNew = false" />
    <CompanySettingsDialog v-if="showSettingsDialog" @close="showSettingsDialog = false" />
    <TourOverlay v-if="tourStore.isActive" />
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
  background: var(--canvas-bg);
}
</style>
