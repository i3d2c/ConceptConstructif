import { evaluate } from 'mathjs'

export interface FormulaVariables {
  L: number
  H: number
  E: number
  S: number
  V: number
  [key: string]: number
}

function customIf(cond: boolean | number, trueVal: number, falseVal: number): number {
  return cond ? trueVal : falseVal
}

function normalize(formula: string): string {
  return formula.replaceAll(';', ',')
}

function buildScope(vars: Record<string, number>): Record<string, unknown> {
  return { ...vars, if: customIf }
}

export function evaluateFormula(formula: string, vars: FormulaVariables): number {
  const result = evaluate(normalize(formula), buildScope(vars))
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error(`Formule invalide : "${formula}" → ${result}`)
  }
  return result
}

export function evaluateRecap(formula: string, X: number): number {
  try {
    const result = evaluate(normalize(formula), buildScope({ X }))
    return typeof result === 'number' && isFinite(result) ? result : X
  } catch { return X }
}

export function validateFormula(formula: string): string | null {
  try {
    evaluate(normalize(formula), buildScope({ L: 1, H: 1, E: 1, S: 1, V: 1 }))
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

export function usesLorH(formula: string): boolean {
  return /\bL\b/.test(formula) || /\bH\b/.test(formula)
}
