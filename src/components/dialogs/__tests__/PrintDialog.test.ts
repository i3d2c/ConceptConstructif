import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrintDialog from '../PrintDialog.vue'
import { defaultPrintConfig } from '../../../print/PrintConfig'

function findCheckbox(wrapper: ReturnType<typeof mount>, label: string) {
  const row = wrapper.findAll('.checkbox-row').find(r => r.text().includes(label))
  return row!.find('input[type="checkbox"]')
}

function allChecked(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('input[type="checkbox"]').every(c => (c.element as HTMLInputElement).checked)
}

describe('PrintDialog', () => {
  describe('Devis checkbox', () => {
    it('Should be checked by default', () => {
      const wrapper = mount(PrintDialog)

      expect((findCheckbox(wrapper, 'Devis').element as HTMLInputElement).checked).toBe(true)
    })

    it('Should include showDevis in the emitted config when unchecked and printing', async () => {
      const wrapper = mount(PrintDialog)
      await findCheckbox(wrapper, 'Devis').setValue(false)
      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][0]).toMatchObject({ showDevis: false })
    })
  })

  describe('initialConfig prop', () => {
    it('Should start from the given initialConfig instead of the default', () => {
      const wrapper = mount(PrintDialog, {
        props: { initialConfig: { ...defaultPrintConfig(), showDevis: false, showList: false } },
      })

      expect((findCheckbox(wrapper, 'Devis').element as HTMLInputElement).checked).toBe(false)
      expect((findCheckbox(wrapper, 'Liste détaillée par tracé').element as HTMLInputElement).checked).toBe(false)
      expect((findCheckbox(wrapper, 'Titre du projet et de la zone').element as HTMLInputElement).checked).toBe(true)
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
        showRecapOuvrage: false, showDevis: false,
        showRecapConstituent: true, showList: true,
      })
    })
  })

  describe('Devis preset button', () => {
    it('Should check only Titre, Vue 2D, Vue 3D and Devis', async () => {
      const wrapper = mount(PrintDialog)

      await wrapper.find('[data-testid="preset-devis"]').trigger('click')
      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][0]).toEqual({
        title: true, show2D: true, show3D: true,
        showRecapOuvrage: false, showDevis: true,
        showRecapConstituent: false, showList: false,
      })
    })
  })

  describe('print scope', () => {
    const groups = [{ id: 'g-1', name: 'Maison complète', zoneIds: [] }]

    it('Should print the active zone by default', async () => {
      const wrapper = mount(PrintDialog, { props: { groups, activeZoneName: 'RDC' } })

      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][1]).toBeNull()
    })

    it('Should not offer a scope choice when the project has no zone group', () => {
      const wrapper = mount(PrintDialog, { props: { groups: [], activeZoneName: 'RDC' } })

      expect(wrapper.find('[data-testid="print-scope"]').exists()).toBe(false)
    })

    it('Should print the chosen group', async () => {
      const wrapper = mount(PrintDialog, { props: { groups, activeZoneName: 'RDC' } })

      await wrapper.find('[data-testid="print-scope"]').setValue('g-1')
      await wrapper.find('.dialog-actions .active').trigger('click')

      expect(wrapper.emitted('print')![0][1]).toBe('g-1')
    })

    it('Should explain and disable the plan views, which only show one zone, once a group is chosen', async () => {
      const wrapper = mount(PrintDialog, { props: { groups, activeZoneName: 'RDC' } })

      await wrapper.find('[data-testid="print-scope"]').setValue('g-1')

      expect(wrapper.find('[data-testid="group-scope-hint"]').text()).toContain('Maison complète')
      expect(findCheckbox(wrapper, 'Vue 2D').attributes('disabled')).toBeDefined()
      expect(findCheckbox(wrapper, 'Vue 3D').attributes('disabled')).toBeDefined()
    })

    it('Should show the disabled plan views unchecked while a group is chosen, and restore them for the active zone', async () => {
      const initialConfig = { ...defaultPrintConfig(), show2D: true, show3D: true }
      const wrapper = mount(PrintDialog, { props: { initialConfig, groups, activeZoneName: 'RDC' } })
      const checked = (label: string) => (findCheckbox(wrapper, label).element as HTMLInputElement).checked

      await wrapper.find('[data-testid="print-scope"]').setValue('g-1')
      expect(checked('Vue 2D')).toBe(false)
      expect(checked('Vue 3D')).toBe(false)

      await wrapper.find('[data-testid="print-scope"]').setValue('')
      expect(checked('Vue 2D')).toBe(true)
      expect(checked('Vue 3D')).toBe(true)
    })
  })
})
