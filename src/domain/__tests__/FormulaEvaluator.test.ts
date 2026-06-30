import { describe, it, expect } from 'vitest'
import { evaluateFormula, validateFormula, usesLorH } from '../services/FormulaEvaluator'

describe('FormulaEvaluator', () => {
  it('évalue une formule simple avec L et H', () => {
    const result = evaluateFormula('L * H', { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875 })
    expect(result).toBeCloseTo(7.5)
  })

  it('évalue une formule avec E pour le nombre de briques', () => {
    const vars = { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875 }
    const result = evaluateFormula('L * H / (0.220 * 0.050)', vars)
    expect(result).toBeCloseTo(681.81, 1)
  })

  it('supporte la cascade via C1 (constituant précédent)', () => {
    const vars = { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875, C1: 681 }
    const result = evaluateFormula('C1 * 0.33 / 100', vars)
    expect(result).toBeCloseTo(2.247, 2)
  })

  it('validateFormula retourne null pour une formule valide', () => {
    expect(validateFormula('L * H / 0.25')).toBeNull()
  })

  it('validateFormula retourne un message d\'erreur pour une syntaxe invalide', () => {
    expect(validateFormula('L ** ** H')).not.toBeNull()
  })

  it('usesLorH détecte L ou H dans une formule', () => {
    expect(usesLorH('L * H / 0.25')).toBe(true)
    expect(usesLorH('S * 1.1')).toBe(false)
  })
})
