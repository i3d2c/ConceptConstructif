import { describe, it, expect } from 'vitest'
import { fmt, fmtQty } from '../format'

describe('fmt', () => {
  it('Should format a number with exactly two decimals and a comma separator', () => {
    expect(fmt(234.5)).toBe('234,50')
  })
})

describe('fmtQty', () => {
  it('Should format a quantity without forcing decimals', () => {
    expect(fmtQty(12)).toBe('12')
  })

  it('Should round a quantity to at most two decimals', () => {
    expect(fmtQty(12.3456)).toBe('12,35')
  })
})
