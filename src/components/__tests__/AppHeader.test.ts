import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import AppHeader from '../AppHeader.vue'
import { useOnboardingTourStore } from '../../stores/onboardingTourStore'
import { useProjectStore } from '../../stores/projectStore'

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

  describe('zone actions menu', () => {
    it('Should open the zone actions menu when the "..." button is clicked', async () => {
      const wrapper = mount(AppHeader)

      await wrapper.find('[title="Actions sur la zone"]').trigger('click')

      expect(wrapper.find('[title="Nouvelle zone"]').exists()).toBe(true)
    })

    it('Should create a new zone and make it active when "Nouvelle zone" is clicked', async () => {
      const store = useProjectStore()
      const wrapper = mount(AppHeader)

      await wrapper.find('[title="Actions sur la zone"]').trigger('click')
      await wrapper.find('[title="Nouvelle zone"]').trigger('click')

      expect(store.project.zones).toHaveLength(2)
      expect(store.project.activeZoneId).toBe(store.project.zones[1].id)
    })

    it('Should duplicate the active zone when "Dupliquer la zone active" is clicked', async () => {
      const store = useProjectStore()
      const originalName = store.activeZone!.name
      const wrapper = mount(AppHeader)

      await wrapper.find('[title="Actions sur la zone"]').trigger('click')
      await wrapper.find('[title="Dupliquer la zone active"]').trigger('click')

      expect(store.project.zones).toHaveLength(2)
      expect(store.activeZone!.name).toBe(`${originalName} (copie)`)
    })

    it('Should remove the active zone when "Supprimer la zone active" is confirmed', async () => {
      const store = useProjectStore()
      store.addZone({ id: 'z-2', name: 'Zone 2', scale: null, backgroundImage: null, colorAssignments: [], traces: [] })
      const idToRemove = store.project.activeZoneId
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const wrapper = mount(AppHeader)

      await wrapper.find('[title="Actions sur la zone"]').trigger('click')
      await wrapper.find('[title="Supprimer la zone active"]').trigger('click')

      expect(store.project.zones.some(z => z.id === idToRemove)).toBe(false)
    })

    it('Should not remove the last remaining zone', async () => {
      const store = useProjectStore()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const wrapper = mount(AppHeader)

      await wrapper.find('[title="Actions sur la zone"]').trigger('click')
      await wrapper.find('[title="Supprimer la zone active"]').trigger('click')

      expect(store.project.zones).toHaveLength(1)
      expect(alertSpy).toHaveBeenCalled()
    })
  })
})
