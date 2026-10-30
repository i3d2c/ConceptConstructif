import { describe, it, expect } from 'vitest'
import { createProfileViewport, profileViewHeight } from '../profileViewport'

describe('createProfileViewport', () => {
  it('should draw the wall with the same scale on both axes, its foot on the bottom-left corner', () => {
    const viewport = createProfileViewport(10, 5, { width: 240, height: 120, pad: 10 })
    expect(viewport.toSvg(0, 0)).toEqual([10, 110])
    expect(viewport.toSvg(10, 5)).toEqual([210, 10])
  })

  it('should convert an SVG point back to a position along the wall and a height', () => {
    const viewport = createProfileViewport(10, 5, { width: 240, height: 120, pad: 10 })
    expect(viewport.toWall(110, 60)).toEqual([5, 2.5])
  })
})

describe('profileViewHeight', () => {
  it('should leave headroom above the highest point so it can be dragged higher', () => {
    const gable = [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }]
    expect(profileViewHeight(gable, 2.5)).toBeCloseTo(7.5)
  })
})
