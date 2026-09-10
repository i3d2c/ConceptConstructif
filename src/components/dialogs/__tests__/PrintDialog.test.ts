import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrintDialog from '../PrintDialog.vue'

function findCheckbox(wrapper: ReturnType<typeof mount>, label: string) {
  const row = wrapper.findAll('.checkbox-row').find(r => r.text().includes(label))
  return row!.find('input[type="checkbox"]')
}

function allChecked(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('input[type="checkbox"]').every(c => (c.element as HTMLInputElement).checked)
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

  describe('Total preset button', () => {
    it('Should check every checkbox when clicked', async () => {
      const wrapper = mount(PrintDialog)
      await findCheckbox(wrapper, 'Vue 3D').setValue(false)

      await wrapper.find('[data-testid="preset-total"]').trigger('click')

      expect(allChecked(wrapper)).toBe(true)
    })
  })

  describe('Chiffrage preset button', () => {
    it('Should check only Titre, Vue 2D, Liste détaillée and Récap par constituant', async () => {
      const wrapper = mount(PrintDialog)

      await wrapper.find('[data-testid="preset-chiffrage"]').trigger('click')
      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][0]).toEqual({
        title: true, show2D: true, show3D: false,
        showRecapOuvrage: false, showRecapTarifs: false,
        showRecapConstituent: true, showList: true,
      })
    })
  })

  describe('Devis preset button', () => {
    it('Should check only Titre, Vue 2D, Vue 3D and Récap. Tarifs', async () => {
      const wrapper = mount(PrintDialog)

      await wrapper.find('[data-testid="preset-devis"]').trigger('click')
      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][0]).toEqual({
        title: true, show2D: true, show3D: true,
        showRecapOuvrage: false, showRecapTarifs: true,
        showRecapConstituent: false, showList: false,
      })
    })
  })
})
