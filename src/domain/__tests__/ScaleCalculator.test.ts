import { describe, it, expect } from 'vitest'
import { buildScale, pixelsToMeters } from '../services/ScaleCalculator'

describe('ScaleCalculator', () => {
  it('calcule pixelLength depuis les deux extrémités du trait', () => {
    const scale = buildScale([[0, 0], [100, 0]], 5)
    expect(scale.pixelLength).toBe(100)
  })

  it('calcule le ratio mètres/pixel', () => {
    const scale = buildScale([[0, 0], [100, 0]], 5)
    expect(scale.ratio).toBe(0.05)
  })

  it('calcule pixelLength sur un trait diagonal via Pythagore', () => {
    const scale = buildScale([[0, 0], [30, 40]], 5)
    expect(scale.pixelLength).toBe(50)
  })

  it('convertit des pixels en mètres via pixelsToMeters', () => {
    const scale = buildScale([[0, 0], [100, 0]], 5)
    expect(pixelsToMeters(60, scale.ratio)).toBeCloseTo(3)
  })
})
