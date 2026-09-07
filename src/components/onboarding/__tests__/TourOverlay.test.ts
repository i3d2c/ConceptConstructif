import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, DOMWrapper } from '@vue/test-utils'
import TourOverlay from '../TourOverlay.vue'
import { useOnboardingTourStore } from '../../../stores/onboardingTourStore'
import { TOUR_STEPS } from '../../../onboarding/tourSteps'

// TourOverlay teleports its content to <body>, so it must be queried there
// rather than through the mounted wrapper's own (now-empty) root element.
function body() {
  return new DOMWrapper(document.body)
}

describe('TourOverlay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  describe('rendering the current step', () => {
    it('Should show the first step title and body, with no Previous button', () => {
      const store = useOnboardingTourStore()
      store.start()
      mount(TourOverlay)

      expect(body().text()).toContain(TOUR_STEPS[0].title)
      expect(body().text()).toContain(TOUR_STEPS[0].body)
      expect(body().find('.tour-prev').exists()).toBe(false)
    })
  })

  describe('navigating with Next', () => {
    it('Should advance through every step, updating title and body', async () => {
      const store = useOnboardingTourStore()
      store.start()
      mount(TourOverlay)

      for (let i = 1; i < TOUR_STEPS.length; i++) {
        await body().find('.tour-next').trigger('click')
        expect(body().text()).toContain(TOUR_STEPS[i].title)
        expect(body().text()).toContain(TOUR_STEPS[i].body)
      }
    })

    it('Should show "Terminer" as the primary button on the last step and finish the tour when clicked', async () => {
      const store = useOnboardingTourStore()
      store.start()
      store.stepIndex = TOUR_STEPS.length - 1
      mount(TourOverlay)

      expect(body().find('.tour-next').text()).toBe('Terminer')
      await body().find('.tour-next').trigger('click')
      expect(store.isActive).toBe(false)
    })
  })

  describe('navigating with Previous', () => {
    it('Should go back to the previous step', async () => {
      const store = useOnboardingTourStore()
      store.start()
      mount(TourOverlay)
      await body().find('.tour-next').trigger('click')

      await body().find('.tour-prev').trigger('click')

      expect(body().text()).toContain(TOUR_STEPS[0].title)
    })
  })

  describe('skipping', () => {
    it('Should deactivate the tour when Skip is clicked', async () => {
      const store = useOnboardingTourStore()
      store.start()
      mount(TourOverlay)

      await body().find('.tour-skip').trigger('click')

      expect(store.isActive).toBe(false)
    })
  })
})
