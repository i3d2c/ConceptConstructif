import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import ZoneSection from '../ZoneSection.vue'

describe('ZoneSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('editing the active zone name', () => {
    it('Should display the active zone name in the input', () => {
      const store = useProjectStore()

      const wrapper = mount(ZoneSection)

      expect((wrapper.find('input.zone-name-input').element as HTMLInputElement).value)
        .toBe(store.activeZone!.name)
    })

    it('Should rename the active zone when the input is blurred', async () => {
      const store = useProjectStore()
      const wrapper = mount(ZoneSection)

      const input = wrapper.find('input.zone-name-input')
      await input.setValue('Etage 1')
      await input.trigger('blur')

      expect(store.activeZone!.name).toBe('Etage 1')
    })

    it('Should rename the active zone when Enter is pressed', async () => {
      const store = useProjectStore()
      const wrapper = mount(ZoneSection)

      const input = wrapper.find('input.zone-name-input')
      await input.setValue('Etage 2')
      await input.trigger('keydown', { key: 'Enter' })

      expect(store.activeZone!.name).toBe('Etage 2')
    })

    it('Should not rename the active zone with an empty name', async () => {
      const store = useProjectStore()
      const originalName = store.activeZone!.name
      const wrapper = mount(ZoneSection)

      const input = wrapper.find('input.zone-name-input')
      await input.setValue('   ')
      await input.trigger('blur')

      expect(store.activeZone!.name).toBe(originalName)
    })
  })
})
