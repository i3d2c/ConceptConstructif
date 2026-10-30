import { describe, it, expect } from 'vitest'
import { profileMeanHeight } from '../services/WallProfile'

const gable = [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }]

describe('profileMeanHeight', () => {
  it('should average the height along the profile', () => {
    expect(profileMeanHeight(gable, 2.5)).toBeCloseTo(3.75)
  })
})
