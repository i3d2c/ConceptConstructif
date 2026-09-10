import { describe, it, expect } from 'vitest'
import { prefillFormula } from '../services/ConstituentFormulaPrefill'
import type { Constituent } from '../models/Constituent'

const brique: Constituent = {
  id: 'c-1', name: 'Brique', unit: 'unité', unitPrice: 1, category: 'Maçonnerie',
  formuleTypique: 'L*H/(0.22*0.05)',
}

describe('prefillFormula', () => {
  it('Should return the constituent formuleTypique when the current formula is empty', () => {
    expect(prefillFormula('', brique)).toBe('L*H/(0.22*0.05)')
  })

  it('Should keep the current formula when it is already set', () => {
    expect(prefillFormula('L*H', brique)).toBe('L*H')
  })

  it('Should return an empty string when the constituent has no formuleTypique', () => {
    const noFormula: Constituent = { id: 'c-2', name: 'Parpaing', unit: 'unité', unitPrice: 2, category: 'Maçonnerie' }
    expect(prefillFormula('', noFormula)).toBe('')
  })

  it('Should return an empty string when the current formula is empty and there is no constituent', () => {
    expect(prefillFormula('', undefined)).toBe('')
  })
})
