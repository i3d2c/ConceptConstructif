import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import ToolsSection from '../ToolsSection.vue'

describe('ToolsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('choosing a trace mode', () => {
    it('Should switch the draw mode to "line" when "Trait" is clicked', async () => {
      const store = useProjectStore()
      const wrapper = mount(ToolsSection)

      await wrapper.find('[title="Tracer un trait (mur)"]').trigger('click')

      expect(store.drawMode).toBe('line')
    })

    it('Should switch the draw mode to "surface" when "Surface" is clicked', async () => {
      const store = useProjectStore()
      const wrapper = mount(ToolsSection)

      await wrapper.find('[title="Tracer une surface"]').trigger('click')

      expect(store.drawMode).toBe('surface')
    })

    it('Should switch the draw mode to "select" when "Select." is clicked', async () => {
      const store = useProjectStore()
      const wrapper = mount(ToolsSection)

      await wrapper.find('[title="Sélectionner"]').trigger('click')

      expect(store.drawMode).toBe('select')
    })

    it('Should not display an "Echelle" button anymore', () => {
      const wrapper = mount(ToolsSection)

      expect(wrapper.text()).not.toContain('Echelle')
    })

    it('Should not display the "Numéros" toggle anymore', () => {
      const wrapper = mount(ToolsSection)

      expect(wrapper.text()).not.toContain('Numéros')
    })
  })
})
