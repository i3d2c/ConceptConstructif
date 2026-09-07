<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useOnboardingTourStore } from '../../stores/onboardingTourStore'

const store = useOnboardingTourStore()

type Rect = { x: number; y: number; width: number; height: number }

const rect = ref<Rect | null>(null)
const CARD_MARGIN = 16
const CARD_WIDTH = 320

function recompute() {
  const target = store.currentStep?.target ?? null
  if (!target) {
    rect.value = null
    return
  }
  const elements = Array.from(document.querySelectorAll(target))
  if (elements.length === 0) {
    rect.value = null
    return
  }
  const boxes = elements.map(el => el.getBoundingClientRect())
  const x = Math.min(...boxes.map(b => b.left))
  const y = Math.min(...boxes.map(b => b.top))
  const right = Math.max(...boxes.map(b => b.right))
  const bottom = Math.max(...boxes.map(b => b.bottom))
  rect.value = { x, y, width: right - x, height: bottom - y }
}

const cardStyle = computed(() => {
  if (!rect.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
  const placement = store.currentStep?.placement ?? 'right'
  const r = rect.value
  if (placement === 'right') {
    const left = Math.min(r.x + r.width + CARD_MARGIN, window.innerWidth - CARD_WIDTH - CARD_MARGIN)
    return { top: `${Math.max(CARD_MARGIN, r.y)}px`, left: `${Math.max(CARD_MARGIN, left)}px` }
  }
  return { top: `${r.y + r.height + CARD_MARGIN}px`, left: `${r.x}px` }
})

watch(() => store.stepIndex, async () => {
  await nextTick()
  recompute()
})

function onResize() {
  recompute()
}

onMounted(() => {
  recompute()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <Teleport to="body">
    <div class="tour-overlay">
      <svg class="tour-mask-overlay" :width="'100%'" :height="'100%'">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              v-if="rect"
              :x="rect.x" :y="rect.y" :width="rect.width" :height="rect.height"
              rx="6" fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
        <rect
          v-if="rect"
          :x="rect.x" :y="rect.y" :width="rect.width" :height="rect.height"
          rx="6" fill="none" stroke="var(--accent)" stroke-width="2"
        />
      </svg>

      <div class="tour-card" :style="cardStyle" v-if="store.currentStep">
        <h3>{{ store.currentStep.title }}</h3>
        <p>{{ store.currentStep.body }}</p>
        <div class="tour-actions">
          <button class="tour-skip" @click="store.skip()">Passer</button>
          <div class="tour-nav">
            <button v-if="!store.isFirstStep" class="tour-prev" @click="store.prev()">Précédent</button>
            <button class="tour-next active" @click="store.next()">{{ store.isLastStep ? 'Terminer' : 'Suivant' }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}
.tour-mask-overlay {
  position: fixed;
  inset: 0;
  pointer-events: all;
}
.tour-card {
  position: fixed;
  width: 320px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
h3 { font-size: 14px; }
p { font-size: 12px; color: var(--text-muted); }
.tour-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.tour-nav { display: flex; gap: 8px; }
</style>
