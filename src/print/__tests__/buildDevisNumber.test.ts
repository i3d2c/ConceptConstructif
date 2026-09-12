import { describe, it, expect } from 'vitest'
import { buildDevisNumber } from '../buildDevisNumber'

describe('buildDevisNumber', () => {
  it('Should prefix the number with the date as YYMMDD', () => {
    const date = new Date(2025, 8, 12, 14, 35, 22)

    const number = buildDevisNumber(date)

    expect(number.startsWith('250912')).toBe(true)
  })

  it('Should suffix the number with the seconds elapsed since midnight', () => {
    const date = new Date(2025, 8, 12, 14, 35, 22)
    const secondsSinceMidnight = 14 * 3600 + 35 * 60 + 22

    const number = buildDevisNumber(date)

    expect(number).toBe(`250912${secondsSinceMidnight}`)
  })

  it('Should suffix with 0 right at midnight', () => {
    const date = new Date(2025, 8, 12, 0, 0, 0)

    const number = buildDevisNumber(date)

    expect(number).toBe('2509120')
  })

  it('Should suffix with 86399 just before the next midnight', () => {
    const date = new Date(2025, 8, 12, 23, 59, 59)

    const number = buildDevisNumber(date)

    expect(number).toBe('25091286399')
  })
})
