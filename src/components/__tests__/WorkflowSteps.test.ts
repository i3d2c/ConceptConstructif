import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import WorkflowSteps from '../WorkflowSteps.vue'

describe('WorkflowSteps', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('importing a background plan', () => {
    it('Should emit "importPlan" when step 1 is clicked', async () => {
      const wrapper = mount(WorkflowSteps)

      await wrapper.find('[data-tour="tour-import-plan"]').trigger('click')

      expect(wrapper.emitted('importPlan')).toHaveLength(1)
    })
  })

  describe('defining the scale', () => {
    it('Should switch the draw mode to "scale" when step 2 is clicked', async () => {
      const store = useProjectStore()
      const wrapper = mount(WorkflowSteps)

      await wrapper.find('[data-tour="tour-scale"]').trigger('click')

      expect(store.drawMode).toBe('scale')
    })

    it('Should mark step 2 as active when the draw mode is "scale"', async () => {
      const store = useProjectStore()
      store.setDrawMode('scale')
      const wrapper = mount(WorkflowSteps)

      expect(wrapper.find('[data-tour="tour-scale"]').classes()).toContain('active')
    })
  })

  describe('opening the ouvrages library', () => {
    it('Should emit "openOuvrages" when step 3 is clicked', async () => {
      const wrapper = mount(WorkflowSteps)

      await wrapper.find('[data-tour="tour-ouvrages"]').trigger('click')

      expect(wrapper.emitted('openOuvrages')).toHaveLength(1)
    })
  })
})
