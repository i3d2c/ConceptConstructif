import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConstituentCombobox from '../ConstituentCombobox.vue'
import type { Constituent } from '../../../domain/models/Constituent'

const brique: Constituent = { id: 'c-1', name: 'Brique', unit: 'unité', unitPrice: 1, category: 'Maçonnerie' }
const parpaing: Constituent = { id: 'c-2', name: 'Parpaing', unit: 'unité', unitPrice: 2, category: 'Maçonnerie' }
const placo: Constituent = { id: 'c-3', name: 'Placo', unit: 'unité', unitPrice: 3, category: 'Plâtrerie' }
const constituentOptions = [brique, parpaing, placo]

function mountCombobox(modelValue = brique.id) {
  return mount(ConstituentCombobox, {
    props: { modelValue, constituentOptions },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

describe('ConstituentCombobox', () => {
  describe('initial display', () => {
    it('Should display the name of the selected constituent', () => {
      const wrapper = mountCombobox(placo.id)
      expect(wrapper.find('input').element.value).toBe('Placo')
    })

    it('Should not show the dropdown list before being focused', () => {
      const wrapper = mountCombobox()
      expect(wrapper.findAll('li').length).toBe(0)
    })
  })

  describe('opening on focus', () => {
    it('Should show all constituent options, unfiltered, once focused', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Brique', 'Parpaing', 'Placo'])
    })

    it('Should reset the category filter to "Toutes catégories" once focused', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      expect((wrapper.find('.cc-category-filter').element as HTMLSelectElement).value).toBe('')
    })
  })

  describe('text search', () => {
    it('Should keep only constituents whose name contains the typed text, case-insensitively', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      await wrapper.find('input').setValue('pla')
      expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Placo'])
    })

    it('Should show an empty list when no constituent matches the typed text', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      await wrapper.find('input').setValue('zzz')
      expect(wrapper.findAll('li').length).toBe(0)
    })
  })

  describe('category filter', () => {
    it('Should keep only constituents from the selected category', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      await wrapper.find('.cc-category-filter').setValue('Plâtrerie')
      expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Placo'])
    })

    it('Should combine the category filter with the text search', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      await wrapper.find('.cc-category-filter').setValue('Maçonnerie')
      await wrapper.find('input').setValue('par')
      expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Parpaing'])
    })
  })

  describe('selecting an option by click', () => {
    it('Should emit update:modelValue with the clicked constituent id, close the list and reset the category filter', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      await wrapper.findAll('li')[1].trigger('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([[parpaing.id]])
      expect(wrapper.findAll('li').length).toBe(0)
    })
  })

  describe('keyboard navigation', () => {
    it('Should move the highlight down and clamp at the end of the list', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.findAll('li')[2].classes()).toContain('cc-highlighted')
    })

    it('Should move the highlight up and clamp at the start of the list', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowUp' })
      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.findAll('li')[0].classes()).toContain('cc-highlighted')
    })

    it('Should select the highlighted option on Enter, like a click', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('update:modelValue')).toEqual([[brique.id]])
    })

    it('Should not emit anything on Enter when no option is highlighted', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('Should close on Escape without emitting and restore the selected constituent name', async () => {
      const wrapper = mountCombobox(placo.id)
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.setValue('br')
      await input.trigger('keydown', { key: 'Escape' })
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.findAll('li').length).toBe(0)
      expect((input.element as HTMLInputElement).value).toBe('Placo')
    })
  })

  describe('closing on outside click', () => {
    it('Should close without emitting and restore the selected constituent name', async () => {
      const wrapper = mountCombobox(placo.id)
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.setValue('br')
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.findAll('li').length).toBe(0)
      expect((input.element as HTMLInputElement).value).toBe('Placo')
    })
  })

  describe('v-model consistency', () => {
    it('Should update the closed display when modelValue changes from outside', async () => {
      const wrapper = mountCombobox(brique.id)
      await wrapper.setProps({ modelValue: placo.id })
      expect(wrapper.find('input').element.value).toBe('Placo')
    })
  })

  describe('dropdown width', () => {
    it('Should give the dropdown a comfortable minimum width even when the input itself is narrow', async () => {
      const wrapper = mountCombobox()
      const inputEl = wrapper.find('input').element
      inputEl.getBoundingClientRect = () => ({
        width: 80, height: 20, left: 10, right: 90, top: 30, bottom: 50, x: 10, y: 30, toJSON() {},
      })
      await wrapper.find('input').trigger('focus')
      const dropdownWidth = parseInt((wrapper.find('.cc-dropdown').element as HTMLElement).style.width, 10)
      expect(dropdownWidth).toBeGreaterThan(80)
    })
  })

  describe('scrolling the dropdown', () => {
    it('Should stay open when the scroll happens inside the dropdown itself', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      wrapper.find('.cc-list').element.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('li').length).toBeGreaterThan(0)
    })

    it('Should still close when the scroll happens outside the dropdown', async () => {
      const wrapper = mountCombobox()
      await wrapper.find('input').trigger('focus')
      document.body.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('li').length).toBe(0)
    })
  })

  describe('re-clicking while already focused', () => {
    it('Should reopen the dropdown when clicking the input again after it was closed by Escape without losing focus', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('keydown', { key: 'Escape' })
      expect(wrapper.findAll('li').length).toBe(0)
      await input.trigger('click')
      expect(wrapper.findAll('li').length).toBeGreaterThan(0)
    })
  })

  describe('leaving the field via Tab', () => {
    it('Should close the dropdown when focus moves away to an unrelated element', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      const unrelated = document.createElement('input')
      document.body.appendChild(unrelated)
      input.element.dispatchEvent(new FocusEvent('focusout', { relatedTarget: unrelated, bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('li').length).toBe(0)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      unrelated.remove()
    })

    it('Should stay open when focus moves from the input into the category filter select', async () => {
      const wrapper = mountCombobox()
      const input = wrapper.find('input')
      await input.trigger('focus')
      const categorySelect = wrapper.find('.cc-category-filter').element
      input.element.dispatchEvent(new FocusEvent('focusout', { relatedTarget: categorySelect, bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('li').length).toBeGreaterThan(0)
    })
  })
})
