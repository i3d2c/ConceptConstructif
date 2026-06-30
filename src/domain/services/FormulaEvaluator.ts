import { evaluate, MathNode } from 'mathjs'

export interface FormulaVariables {
  L: number
  H: number
  E: number
  S: number
  V: number
  [key: string]: number
}

const ALLOWED_SYMBOLS = new Set([
  'L', 'H', 'E', 'S', 'V',
  'sqrt', 'log', 'log10', 'abs', 'floor', 'ceil', 'round',
  'min', 'max', 'pow', 'pi', 'e',
])

export function evaluateFormula(formula: string, vars: FormulaVariables): number {
  const result = evaluate(formula, vars)
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error(`Formule invalide : "${formula}" → ${result}`)
  }
  return result
}

export function validateFormula(formula: string): string | null {
  try {
    evaluate(formula, { L: 1, H: 1, E: 1, S: 1, V: 1 })
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

export function usesLorH(formula: string): boolean {
  try {
    const node = evaluate(formula, { L: 1, H: 1, E: 1, S: 1, V: 1 }) as unknown as MathNode
    void node
  } catch (_) {
    // ignore
  }
  return /\bL\b/.test(formula) || /\bH\b/.test(formula)
}
