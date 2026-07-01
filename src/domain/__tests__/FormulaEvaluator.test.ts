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

  it('if() retourne la branche vraie', () => {
    const vars = { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875 }
    expect(evaluateFormula('if(L > 0; L * 2; 0)', vars)).toBeCloseTo(6)
  })

  it('if() retourne la branche fausse', () => {
    const vars = { L: 0, H: 2.5, E: 0.105, S: 0, V: 0 }
    expect(evaluateFormula('if(L > 0; L * 2; 99)', vars)).toBe(99)
  })

  it('if() fonctionne avec cascade C1', () => {
    const vars = { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875, C1: 10 }
    expect(evaluateFormula('if(C1 > 5; C1 * 2; 0)', vars)).toBeCloseTo(20)
  })

  it('if() accepte les virgules comme séparateurs', () => {
    const vars = { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875 }
    expect(evaluateFormula('if(L > 0, L * 2, 0)', vars)).toBeCloseTo(6)
  })

  it('if() imbriqué dans la branche vraie', () => {
    const vars = { L: 6, H: 3, E: 0.105, S: 18, V: 1.89 }
    // L > 5 → vrai ; H > 2 → vrai → L * H = 18
    expect(evaluateFormula('if(L > 5; if(H > 2; L * H; L); 0)', vars)).toBeCloseTo(18)
  })

  it('if() imbriqué dans la branche fausse (chaîné)', () => {
    const vars = { L: 3, H: 2.5, E: 0.105, S: 7.5, V: 0.7875 }
    // L > 10 → faux ; L > 2 → vrai → L / 2 = 1.5
    expect(evaluateFormula('if(L > 10; L; if(L > 2; L / 2; 0))', vars)).toBeCloseTo(1.5)
  })
})
