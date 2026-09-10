import { describe, it, expect } from 'vitest'
import { defaultPrintConfig } from '../PrintConfig'

describe('defaultPrintConfig', () => {
  it('Should default showDevis to true', () => {
    expect(defaultPrintConfig().showDevis).toBe(true)
  })
})
