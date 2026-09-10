import type { Constituent } from '../models/Constituent'

export function prefillFormula(currentFormula: string, constituent: Constituent | undefined): string {
  // never overwrite a user-entered formula
  if (currentFormula !== '') return currentFormula
  return constituent?.formuleTypique ?? ''
}
