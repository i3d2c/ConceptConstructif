import { describe, it, expect } from 'vitest'
import { snapHeight, snapPosition } from '../profileSnap'

describe('snapHeight', () => {
  it('should round a height to the nearest 5 cm, never below the ground', () => {
    expect(snapHeight(2.47)).toBeCloseTo(2.45)
    expect(snapHeight(2.48)).toBeCloseTo(2.5)
    expect(snapHeight(-0.3)).toBe(0)
  })

  it('should give exact decimal heights, without floating-point noise', () => {
    expect(snapHeight(1.91)).toBe(1.9)
  })
})

describe('snapPosition', () => {
  it('should stick to the middle of the wall within the magnet radius', () => {
    expect(snapPosition(5.13, 10, 0.2)).toBe(5)
  })

  it('should round to the nearest 5 cm outside the magnet radius', () => {
    expect(snapPosition(3.62, 10, 0.2)).toBeCloseTo(3.6)
  })
})
