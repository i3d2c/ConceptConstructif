import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import OuvrageLibraryModal from '../OuvrageLibraryModal.vue'
import UnsavedChangesDialog from '../dialogs/UnsavedChangesDialog.vue'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'

const constituent: Constituent = {
  id: 'c-1', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const ouvrageA: Ouvrage = {
  id: 'o-a', name: 'Mur A', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-1', constituentId: constituent.id, position: 1, formula: 'L' }],
}
const ouvrageB: Ouvrage = {
  id: 'o-b', name: 'Mur B', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-2', constituentId: constituent.id, position: 1, formula: 'L' }],
}

async function mountModalWithTwoOuvrages() {
  const store = useProjectStore()
  store.project.ouvrages.push(ouvrageA, ouvrageB)
  store.project.constituents.push(constituent)
  const wrapper = mount(OuvrageLibraryModal)
  await flushPromises()
  return wrapper
}

function nameInput(wrapper: ReturnType<typeof mount>) {
  return wrapper.find<HTMLInputElement>('input[placeholder="ex: Mur brique 1 brique"]')
}

describe('OuvrageLibraryModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('selecting another ouvrage while the current draft is dirty', () => {
    it('Should show the unsaved-changes dialog instead of switching right away', async () => {
      const wrapper = await mountModalWithTwoOuvrages()
      await wrapper.findAll('.list-item')[0].trigger('click')
      await nameInput(wrapper).setValue('Mur A modifié')

      await wrapper.findAll('.list-item')[1].trigger('click')

      expect(wrapper.findComponent(UnsavedChangesDialog).exists()).toBe(true)
      expect(nameInput(wrapper).element.value).toBe('Mur A modifié')
    })

    it('Should switch to the target ouvrage once the discard is confirmed', async () => {
      const wrapper = await mountModalWithTwoOuvrages()
      await wrapper.findAll('.list-item')[0].trigger('click')
      await nameInput(wrapper).setValue('Mur A modifié')
      await wrapper.findAll('.list-item')[1].trigger('click')

      await wrapper.findComponent(UnsavedChangesDialog).find('button.danger').trigger('click')

      expect(wrapper.findComponent(UnsavedChangesDialog).exists()).toBe(false)
      expect(nameInput(wrapper).element.value).toBe(ouvrageB.name)
    })

    it('Should keep the current draft untouched when the navigation is canceled', async () => {
      const wrapper = await mountModalWithTwoOuvrages()
      await wrapper.findAll('.list-item')[0].trigger('click')
      await nameInput(wrapper).setValue('Mur A modifié')
      await wrapper.findAll('.list-item')[1].trigger('click')

      await wrapper.findComponent(UnsavedChangesDialog).find('button:not(.danger)').trigger('click')

      expect(wrapper.findComponent(UnsavedChangesDialog).exists()).toBe(false)
      expect(nameInput(wrapper).element.value).toBe('Mur A modifié')
    })
  })

  describe('selecting another ouvrage while the current draft is clean', () => {
    it('Should switch right away without showing the dialog', async () => {
      const wrapper = await mountModalWithTwoOuvrages()
      await wrapper.findAll('.list-item')[0].trigger('click')

      await wrapper.findAll('.list-item')[1].trigger('click')

      expect(wrapper.findComponent(UnsavedChangesDialog).exists()).toBe(false)
      expect(nameInput(wrapper).element.value).toBe(ouvrageB.name)
    })
  })
})
