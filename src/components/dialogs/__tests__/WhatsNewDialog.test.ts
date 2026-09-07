import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WhatsNewDialog from '../WhatsNewDialog.vue'

describe('WhatsNewDialog', () => {
  describe('rendering', () => {
    it('Should render the four announcement items', () => {
      const wrapper = mount(WhatsNewDialog)
      const items = wrapper.findAll('li')
      expect(items).toHaveLength(4)
    })
  })

  describe('closing', () => {
    it('Should emit close when the close button is clicked', async () => {
      const wrapper = mount(WhatsNewDialog)
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('Should emit close when the overlay is clicked outside the dialog', async () => {
      const wrapper = mount(WhatsNewDialog)
      await wrapper.find('.dialog-overlay').trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })
})
