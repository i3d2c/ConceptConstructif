import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OuvrageForm from '../OuvrageForm.vue'
import ConstituentCombobox from '../ConstituentCombobox.vue'
import type { Ouvrage } from '../../../domain/models/Ouvrage'
import type { Constituent } from '../../../domain/models/Constituent'

const constituent: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
  formuleTypique: 'L*H/(0.22*0.05)',
}

const existingOuvrage: Ouvrage = {
  id: 'o-1', name: 'Mur brique', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-1', constituentId: constituent.id, position: 1, formula: 'L' }],
}

function mountForm(editingOuvrage: Ouvrage | null = null) {
  return mount(OuvrageForm, {
    props: {
      editingOuvrage,
      constituentOptions: [constituent],
      categorySuggestions: [],
      publishedConstituentIds: new Set<string>(),
      isLinkedToLibrary: false,
    },
  })
}

describe('OuvrageForm', () => {
  describe('isDirty', () => {
    it('Should not be dirty right after mount', () => {
      const wrapper = mountForm(existingOuvrage)
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(false)
    })

    it('Should become dirty after a field is edited', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('input[placeholder="ex: Mur brique 1 brique"]').setValue('Mur brique modifié')
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(true)
    })

    it('Should become dirty after adding a constituent row', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('.oc-add-btn').trigger('click')
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(true)
    })

    it('Should not be dirty for a brand new ouvrage with untouched fields', () => {
      const wrapper = mountForm(null)
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(false)
    })

    it('Should stop being dirty after saving', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('input[placeholder="ex: Mur brique 1 brique"]').setValue('Mur brique modifié')
      await wrapper.find('.form-actions button').trigger('click')
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(false)
    })

    it('Should become dirty after infosTechniques is edited', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('textarea[placeholder]').setValue('Notes internes')
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(true)
    })
  })

  describe('addOC', () => {
    it('Should add a new line with no constituent selected and an empty formula', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('.oc-add-btn').trigger('click')
      const comboboxes = wrapper.findAllComponents(ConstituentCombobox)
      const formulaInputs = wrapper.findAll('.oc-formulas input')
      expect(comboboxes[comboboxes.length - 1].props('modelValue')).toBe('')
      expect((formulaInputs[formulaInputs.length - 1].element as HTMLInputElement).value).toBe('')
    })

    it('Should prefill the formula once a constituent is chosen for a freshly added line', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('.oc-add-btn').trigger('click')
      const comboboxes = wrapper.findAllComponents(ConstituentCombobox)
      await comboboxes[comboboxes.length - 1].vm.$emit('update:modelValue', constituent.id)
      const formulaInputs = wrapper.findAll('.oc-formulas input')
      const lastFormulaInput = formulaInputs[formulaInputs.length - 1].element as HTMLInputElement
      expect(lastFormulaInput.value).toBe('L*H/(0.22*0.05)')
    })
  })

  describe('+ Constituant button', () => {
    it('Should render the + Constituant button below the constituent list rather than in the header', () => {
      const wrapper = mountForm(existingOuvrage)
      expect(wrapper.find('.oc-header button:not(.help-btn)').exists()).toBe(false)
      expect(wrapper.find('.oc-add-btn').text()).toBe('+ Constituant')
    })

    it("Should focus the new row's constituent selector after clicking + Constituant", async () => {
      const wrapper = mount(OuvrageForm, {
        attachTo: document.body,
        props: {
          editingOuvrage: existingOuvrage,
          constituentOptions: [constituent],
          categorySuggestions: [],
          publishedConstituentIds: new Set<string>(),
          isLinkedToLibrary: false,
        },
      })
      await wrapper.find('.oc-add-btn').trigger('click')
      const comboboxInputs = wrapper.findAll('.oc-row .cc-combobox input')
      const lastComboboxInput = comboboxInputs[comboboxInputs.length - 1].element
      expect(document.activeElement).toBe(lastComboboxInput)
      wrapper.unmount()
    })
  })

  describe('variables tooltip', () => {
    it('Should not render a standalone Variables help button', () => {
      const wrapper = mountForm(existingOuvrage)
      const buttons = wrapper.findAll('button').map(b => b.text())
      expect(buttons).not.toContain('? Variables')
    })

    it('Should show the variables tooltip when a row emits formulaFocus', async () => {
      const wrapper = mountForm(existingOuvrage)
      const row = wrapper.findComponent({ name: 'OuvrageConstituentRow' })
      await row.find('.oc-formulas input').trigger('focus')
      expect(wrapper.findComponent({ name: 'FormulaVariablesTooltip' }).props('visible')).toBe(true)
    })

    it('Should hide the variables tooltip when the row emits formulaBlur', async () => {
      const wrapper = mountForm(existingOuvrage)
      const row = wrapper.findComponent({ name: 'OuvrageConstituentRow' })
      await row.find('.oc-formulas input').trigger('focus')
      await row.find('.oc-formulas input').trigger('blur')
      expect(wrapper.findComponent({ name: 'FormulaVariablesTooltip' }).props('visible')).toBe(false)
    })
  })

  describe('saveOuvrage', () => {
    it('Should include infosTechniques in the saved ouvrage when filled', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('textarea[placeholder]').setValue('Détails techniques internes')
      await wrapper.find('.form-actions button').trigger('click')
      const saved = wrapper.emitted('save')![0][0] as Ouvrage
      expect(saved.infosTechniques).toBe('Détails techniques internes')
    })

    it('Should omit infosTechniques when left empty', async () => {
      const wrapper = mountForm(existingOuvrage)
      await wrapper.find('.form-actions button').trigger('click')
      const saved = wrapper.emitted('save')![0][0] as Ouvrage
      expect(saved.infosTechniques).toBeUndefined()
    })
  })
})
