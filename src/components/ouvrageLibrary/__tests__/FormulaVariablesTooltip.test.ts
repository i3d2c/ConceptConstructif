import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormulaVariablesTooltip from '../FormulaVariablesTooltip.vue'

describe('FormulaVariablesTooltip', () => {
  it('Should render its slot content when visible is true', () => {
    const wrapper = mount(FormulaVariablesTooltip, {
      props: { visible: true, position: { top: 10, left: 20 } },
      slots: { default: '<span class="marker">content</span>' },
      global: { stubs: { teleport: true } },
    })
    expect(wrapper.find('.marker').exists()).toBe(true)
  })

  it('Should render nothing when visible is false', () => {
    const wrapper = mount(FormulaVariablesTooltip, {
      props: { visible: false, position: { top: 10, left: 20 } },
      slots: { default: '<span class="marker">content</span>' },
      global: { stubs: { teleport: true } },
    })
    expect(wrapper.find('.marker').exists()).toBe(false)
  })
})
