import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OuvrageForm from '../OuvrageForm.vue'
import type { Ouvrage } from '../../../domain/models/Ouvrage'
import type { Constituent } from '../../../domain/models/Constituent'

const constituent: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
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
      defaultConstituentId: constituent.id,
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
      await wrapper.find('.oc-header button:not(.help-btn)').trigger('click')
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
