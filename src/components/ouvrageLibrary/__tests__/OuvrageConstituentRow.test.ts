import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OuvrageConstituentRow from '../OuvrageConstituentRow.vue'
import ConstituentCombobox from '../ConstituentCombobox.vue'
import type { OuvrageConstituent } from '../../../domain/models/Ouvrage'
import type { Constituent } from '../../../domain/models/Constituent'

const brique: Constituent = { id: 'c-1', name: 'Brique', unit: 'unité', unitPrice: 1, category: 'Maçonnerie' }
const parpaing: Constituent = {
  id: 'c-2', name: 'Parpaing', unit: 'unité', unitPrice: 2, category: 'Maçonnerie',
  formuleTypique: 'L*H/(0.2*0.5)',
}
const constituentOptions = [brique, parpaing]

function mountRow(oc: OuvrageConstituent) {
  return mount(OuvrageConstituentRow, {
    props: { oc, constituentOptions, isDragging: false },
  })
}

describe('OuvrageConstituentRow', () => {
  describe('constituent change', () => {
    it('Should prefill the formula when the constituent changes and the formula is empty', async () => {
      const oc: OuvrageConstituent = { id: 'oc-1', constituentId: brique.id, position: 1, formula: '' }
      const wrapper = mountRow(oc)
      await wrapper.findComponent(ConstituentCombobox).vm.$emit('update:modelValue', parpaing.id)
      expect(oc.formula).toBe('L*H/(0.2*0.5)')
    })

    it('Should not overwrite an existing formula when the constituent changes', async () => {
      const oc: OuvrageConstituent = { id: 'oc-1', constituentId: brique.id, position: 1, formula: 'L*H' }
      const wrapper = mountRow(oc)
      await wrapper.findComponent(ConstituentCombobox).vm.$emit('update:modelValue', parpaing.id)
      expect(oc.formula).toBe('L*H')
    })
  })
})
