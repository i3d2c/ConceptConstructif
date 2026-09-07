import { describe, it, expect } from 'vitest'
import { TOUR_STEPS, type TourPlacement } from '../tourSteps'

const VALID_PLACEMENTS: TourPlacement[] = ['center', 'right', 'top', 'bottom', 'left']

describe('tourSteps', () => {
  it('Should define exactly 8 steps', () => {
    expect(TOUR_STEPS).toHaveLength(8)
  })

  it('Should have unique ids', () => {
    const ids = TOUR_STEPS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('Should have no target for the first two steps', () => {
    expect(TOUR_STEPS[0].target).toBeNull()
    expect(TOUR_STEPS[1].target).toBeNull()
  })

  it('Should have a non-null target selector for steps 3 through 8', () => {
    for (const step of TOUR_STEPS.slice(2)) {
      expect(step.target).not.toBeNull()
      expect(typeof step.target).toBe('string')
    }
  })

  it('Should use a valid placement for every step', () => {
    for (const step of TOUR_STEPS) {
      expect(VALID_PLACEMENTS).toContain(step.placement)
    }
  })
})
