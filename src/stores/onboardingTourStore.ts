import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TOUR_STEPS } from '../onboarding/tourSteps'

export const STORAGE_KEY = 'cc_onboarding_seen'

export const useOnboardingTourStore = defineStore('onboardingTour', () => {
  const shouldShow = ref(false)
  const isActive = ref(false)
  const stepIndex = ref(0)

  const currentStep = computed(() => TOUR_STEPS[stepIndex.value] ?? null)
  const isFirstStep = computed(() => stepIndex.value === 0)
  const isLastStep = computed(() => stepIndex.value === TOUR_STEPS.length - 1)

  function init() {
    shouldShow.value = localStorage.getItem(STORAGE_KEY) !== '1'
  }

  function start() {
    stepIndex.value = 0
    isActive.value = true
  }

  function next() {
    if (isLastStep.value) {
      finish()
    } else {
      stepIndex.value++
    }
  }

  function prev() {
    if (stepIndex.value > 0) stepIndex.value--
  }

  function skip() {
    finish()
  }

  function finish() {
    isActive.value = false
    markSeen()
  }

  function markSeen() {
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return {
    shouldShow, isActive, stepIndex, currentStep, isFirstStep, isLastStep,
    init, start, next, prev, skip, finish, markSeen,
  }
})
