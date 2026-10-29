import { describe, it, expect } from 'vitest'
import { profileHeightAt, profileMeanHeight } from '../services/WallProfile'

const gable = [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }]

describe('profileHeightAt', () => {
  it('should interpolate the height linearly between two profile points', () => {
    expect(profileHeightAt(gable, 0.25, 2.5)).toBeCloseTo(3.75)
  })

  it('should return the exact height on a profile point, including the start', () => {
    expect(profileHeightAt(gable, 0, 2.5)).toBe(2.5)
    expect(profileHeightAt(gable, 0.5, 2.5)).toBe(5)
    expect(profileHeightAt(gable, 1, 2.5)).toBe(2.5)
  })
})

describe('profileMeanHeight', () => {
  it('should average the height along the profile', () => {
    expect(profileMeanHeight(gable, 2.5)).toBeCloseTo(3.75)
  })
})
