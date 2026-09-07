import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConstituentForm from '../ConstituentForm.vue'
import type { Constituent } from '../../../domain/models/Constituent'

const existingConstituent: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}

function mountForm(editingConstituent: Constituent | null = null) {
  return mount(ConstituentForm, {
    props: {
      editingConstituent,
      units: [],
      suppliers: [],
      categorySuggestions: [],
      isLinkedToLibrary: false,
    },
  })
}

describe('ConstituentForm', () => {
  describe('isDirty', () => {
    it('Should not be dirty right after mount', () => {
      const wrapper = mountForm(existingConstituent)
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(false)
    })

    it('Should become dirty after a field is edited', async () => {
      const wrapper = mountForm(existingConstituent)
      await wrapper.find('input[placeholder="ex: Brique pleine"]').setValue('Brique creuse')
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(true)
    })

    it('Should not be dirty for a brand new constituent with untouched fields', () => {
      const wrapper = mountForm(null)
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(false)
    })

    it('Should stop being dirty after saving', async () => {
      const wrapper = mountForm(existingConstituent)
      await wrapper.find('input[placeholder="ex: Brique pleine"]').setValue('Brique creuse')
      await wrapper.find('.form-actions button').trigger('click')
      expect((wrapper.vm as unknown as { isDirty: boolean }).isDirty).toBe(false)
    })
  })
})
