import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import OptionsSection from '../OptionsSection.vue'

describe('OptionsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('toggling the 3D view', () => {
    it('Should emit "toggle3d" when the 3D button is clicked', async () => {
      const wrapper = mount(OptionsSection, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[data-tour="tour-3d"]').trigger('click')

      expect(wrapper.emitted('toggle3d')).toHaveLength(1)
    })

    it('Should mark the 3D button active when show3d is true', () => {
      const wrapper = mount(OptionsSection, { props: { show3d: true, showChiffrage: false } })

      expect(wrapper.find('[data-tour="tour-3d"]').classes()).toContain('active')
    })

    it('Should unmark the 3D button when show3d becomes false, e.g. after the panel is closed', async () => {
      const wrapper = mount(OptionsSection, { props: { show3d: true, showChiffrage: false } })
      expect(wrapper.find('[data-tour="tour-3d"]').classes()).toContain('active')

      await wrapper.setProps({ show3d: false })

      expect(wrapper.find('[data-tour="tour-3d"]').classes()).not.toContain('active')
    })
  })

  describe('toggling the chiffrage panel', () => {
    it('Should emit "toggleChiffrage" when the chiffrage button is clicked', async () => {
      const wrapper = mount(OptionsSection, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[data-tour="tour-chiffrage"]').trigger('click')

      expect(wrapper.emitted('toggleChiffrage')).toHaveLength(1)
    })

    it('Should mark the chiffrage button active when showChiffrage is true', () => {
      const wrapper = mount(OptionsSection, { props: { show3d: false, showChiffrage: true } })

      expect(wrapper.find('[data-tour="tour-chiffrage"]').classes()).toContain('active')
    })
  })

  describe('toggling the trace numbers', () => {
    it('Should toggle store.showNumbers when the numbers button is clicked', async () => {
      const store = useProjectStore()
      store.showNumbers = true
      const wrapper = mount(OptionsSection, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[title*="numéros"]').trigger('click')

      expect(store.showNumbers).toBe(false)
    })

    it('Should mark the numbers button active when store.showNumbers is true', () => {
      const store = useProjectStore()
      store.showNumbers = true
      const wrapper = mount(OptionsSection, { props: { show3d: false, showChiffrage: false } })

      expect(wrapper.find('[title*="numéros"]').classes()).toContain('active')
    })
  })
})
