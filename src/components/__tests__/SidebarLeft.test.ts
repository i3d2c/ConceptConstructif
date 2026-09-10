import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SidebarLeft from '../SidebarLeft.vue'

describe('SidebarLeft', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('workflow ordering', () => {
    it('Should render the zone title before the numbered workflow steps, the steps before the trace tools, and the trace tools before the color palette', () => {
      const wrapper = mount(SidebarLeft, { props: { show3d: false, showChiffrage: false } })

      const html = wrapper.html()
      const zoneIdx = html.indexOf('zone-name-input')
      const stepIdx = html.indexOf('tour-import-plan')
      const tracerIdx = html.indexOf('Tracer')
      const colorIdx = html.indexOf('+ Couleur')
      const optionsIdx = html.indexOf('Options')

      expect(zoneIdx).toBeGreaterThanOrEqual(0)
      expect(zoneIdx).toBeLessThan(stepIdx)
      expect(stepIdx).toBeLessThan(tracerIdx)
      expect(tracerIdx).toBeLessThan(colorIdx)
      expect(colorIdx).toBeLessThan(optionsIdx)
    })
  })

  describe('forwarding events from child sections', () => {
    it('Should forward "importPlan" from the workflow steps', async () => {
      const wrapper = mount(SidebarLeft, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[data-tour="tour-import-plan"]').trigger('click')

      expect(wrapper.emitted('importPlan')).toHaveLength(1)
    })

    it('Should forward "openOuvrages" from the workflow steps', async () => {
      const wrapper = mount(SidebarLeft, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[data-tour="tour-ouvrages"]').trigger('click')

      expect(wrapper.emitted('openOuvrages')).toHaveLength(1)
    })

    it('Should forward "toggle3d" from the options section', async () => {
      const wrapper = mount(SidebarLeft, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[data-tour="tour-3d"]').trigger('click')

      expect(wrapper.emitted('toggle3d')).toHaveLength(1)
    })

    it('Should forward "toggleChiffrage" from the options section', async () => {
      const wrapper = mount(SidebarLeft, { props: { show3d: false, showChiffrage: false } })

      await wrapper.find('[data-tour="tour-chiffrage"]').trigger('click')

      expect(wrapper.emitted('toggleChiffrage')).toHaveLength(1)
    })
  })

  describe('reflecting the 3D/chiffrage panel state', () => {
    it('Should pass the show3d prop down to the options section button', () => {
      const wrapper = mount(SidebarLeft, { props: { show3d: true, showChiffrage: false } })

      expect(wrapper.find('[data-tour="tour-3d"]').classes()).toContain('active')
    })
  })
})
