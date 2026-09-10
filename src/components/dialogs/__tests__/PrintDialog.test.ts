import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrintDialog from '../PrintDialog.vue'

function findCheckbox(wrapper: ReturnType<typeof mount>, label: string) {
  const row = wrapper.findAll('.checkbox-row').find(r => r.text().includes(label))
  return row!.find('input[type="checkbox"]')
}

describe('PrintDialog', () => {
  describe('Récap. Tarifs checkbox', () => {
    it('Should be checked by default', () => {
      const wrapper = mount(PrintDialog)

      expect((findCheckbox(wrapper, 'Récap. Tarifs').element as HTMLInputElement).checked).toBe(true)
    })

    it('Should include showRecapTarifs in the emitted config when unchecked and printing', async () => {
      const wrapper = mount(PrintDialog)
      await findCheckbox(wrapper, 'Récap. Tarifs').setValue(false)
      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][0]).toMatchObject({ showRecapTarifs: false })
    })
  })
})
