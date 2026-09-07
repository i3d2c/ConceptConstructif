import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOnboardingTourStore, STORAGE_KEY } from '../onboardingTourStore'
import { TOUR_STEPS } from '../../onboarding/tourSteps'

describe('onboardingTourStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('init', () => {
    it('Should set shouldShow to true when nothing is stored yet', () => {
      const store = useOnboardingTourStore()
      store.init()
      expect(store.shouldShow).toBe(true)
    })

    it('Should set shouldShow to false when the tour was already seen', () => {
      localStorage.setItem(STORAGE_KEY, '1')
      const store = useOnboardingTourStore()
      store.init()
      expect(store.shouldShow).toBe(false)
    })
  })

  describe('start', () => {
    it('Should activate the tour at the first step', () => {
      const store = useOnboardingTourStore()
      store.start()
      expect(store.isActive).toBe(true)
      expect(store.stepIndex).toBe(0)
      expect(store.currentStep).toEqual(TOUR_STEPS[0])
      expect(store.isFirstStep).toBe(true)
    })
  })

  describe('next', () => {
    it('Should advance to the next step', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.next()
      expect(store.stepIndex).toBe(1)
      expect(store.currentStep).toEqual(TOUR_STEPS[1])
    })

    it('Should finish the tour when called on the last step', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.stepIndex = TOUR_STEPS.length - 1
      expect(store.isLastStep).toBe(true)
      store.next()
      expect(store.isActive).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    })
  })

  describe('prev', () => {
    it('Should go back to the previous step', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.next()
      store.prev()
      expect(store.stepIndex).toBe(0)
    })

    it('Should do nothing on the first step', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.prev()
      expect(store.stepIndex).toBe(0)
    })
  })

  describe('skip', () => {
    it('Should deactivate the tour and persist that it was seen', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.skip()
      expect(store.isActive).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    })
  })

  describe('finish', () => {
    it('Should deactivate the tour and persist that it was seen', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.finish()
      expect(store.isActive).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    })

    it('Should allow restarting the tour after it was finished', () => {
      const store = useOnboardingTourStore()
      store.start()
      store.finish()
      store.start()
      expect(store.isActive).toBe(true)
      expect(store.stepIndex).toBe(0)
    })
  })
})
