import { describe, it, expect } from 'vitest'
import { computePolygonArea, applyAngle } from '../services/SurfaceCalculator'

describe('SurfaceCalculator', () => {
  it('calcule l\'aire d\'un rectangle simple', () => {
    const points: [number, number][] = [[0, 0], [4, 0], [4, 3], [0, 3]]
    expect(computePolygonArea(points)).toBe(12)
  })

  it('calcule l\'aire d\'un triangle rectangle', () => {
    const points: [number, number][] = [[0, 0], [6, 0], [0, 4]]
    expect(computePolygonArea(points)).toBe(12)
  })

  it('applyAngle à 0° retourne la surface projetée inchangée', () => {
    expect(applyAngle(10, 0)).toBe(10)
  })

  it('applyAngle à 60° double la surface (1/cos60° = 2)', () => {
    expect(applyAngle(10, 60)).toBeCloseTo(20)
  })
})
