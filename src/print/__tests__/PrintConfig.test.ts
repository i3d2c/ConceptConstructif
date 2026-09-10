import { describe, it, expect } from 'vitest'
import { defaultPrintConfig } from '../PrintConfig'

describe('defaultPrintConfig', () => {
  it('Should default showRecapTarifs to true', () => {
    expect(defaultPrintConfig().showRecapTarifs).toBe(true)
  })
})
