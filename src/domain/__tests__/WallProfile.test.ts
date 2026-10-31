import { describe, it, expect } from 'vitest'
import { profileHeightAt, profileMeanHeight, insertProfilePoint, removeProfilePoint, moveProfilePoint } from '../services/WallProfile'

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

describe('insertProfilePoint', () => {
  const minGap = 0.05

  it('should insert a point at the given position with an interpolated offset, keeping the shape', () => {
    expect(insertProfilePoint(gable, 0.25, minGap)).toEqual([
      { at: 0, offset: 0 }, { at: 0.25, offset: 1.25 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 },
    ])
  })

  it('should leave the profile unchanged when the position is closer than minGap to an existing point', () => {
    for (const at of [0, 0.03, 0.5, 0.52, 0.97, 1, -0.1, 1.2]) {
      expect(insertProfilePoint(gable, at, minGap)).toEqual(gable)
    }
  })
})

describe('removeProfilePoint', () => {
  it('should remove an intermediate point', () => {
    expect(removeProfilePoint(gable, 1)).toEqual([{ at: 0, offset: 0 }, { at: 1, offset: 0 }])
  })

  it('should keep the start and end points', () => {
    expect(removeProfilePoint(gable, 0)).toEqual(gable)
    expect(removeProfilePoint(gable, 2)).toEqual(gable)
  })
})

describe('moveProfilePoint', () => {
  const minGap = 0.05

  it('should move an intermediate point to a new position and offset', () => {
    expect(moveProfilePoint(gable, 1, 0.4, 3, minGap)[1]).toEqual({ at: 0.4, offset: 3 })
  })

  it('should keep an intermediate point at least minGap away from its neighbours', () => {
    expect(moveProfilePoint(gable, 1, 1.4, 3, minGap)[1].at).toBeCloseTo(0.95)
    expect(moveProfilePoint(gable, 1, -0.2, 3, minGap)[1].at).toBeCloseTo(0.05)
  })

  it('should keep the start and end at their position, only changing their offset', () => {
    expect(moveProfilePoint(gable, 0, 0.3, 1, minGap)[0]).toEqual({ at: 0, offset: 1 })
    expect(moveProfilePoint(gable, 2, 0.7, -0.5, minGap)[2]).toEqual({ at: 1, offset: -0.5 })
  })
})
