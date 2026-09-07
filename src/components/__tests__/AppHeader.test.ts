import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import AppHeader from '../AppHeader.vue'
import { useOnboardingTourStore } from '../../stores/onboardingTourStore'

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('replaying the guided tour', () => {
    it('Should start the onboarding tour when the "?" button is clicked', async () => {
      const tourStore = useOnboardingTourStore()
      const wrapper = mount(AppHeader)

      await wrapper.find('[title="Revoir la visite guidée"]').trigger('click')

      expect(tourStore.isActive).toBe(true)
      expect(tourStore.stepIndex).toBe(0)
    })
  })
})
