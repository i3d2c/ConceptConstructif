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

  it('Should have no target for the welcome step', () => {
    expect(TOUR_STEPS[0].target).toBeNull()
  })

  it('Should have a non-null target selector for steps 2 through 8', () => {
    for (const step of TOUR_STEPS.slice(1)) {
      expect(step.target).not.toBeNull()
      expect(typeof step.target).toBe('string')
    }
  })

  it('Should target the "Importer un plan" button for the plan step', () => {
    const planStep = TOUR_STEPS.find(s => s.id === 'plan')
    expect(planStep?.target).toBe('[data-tour="tour-import-plan"]')
  })

  it('Should use a valid placement for every step', () => {
    for (const step of TOUR_STEPS) {
      expect(VALID_PLACEMENTS).toContain(step.placement)
    }
  })

  it('Should order the numbered steps (plan, scale, ouvrages) before the color and trace steps', () => {
    expect(TOUR_STEPS.map(s => s.id)).toEqual([
      'welcome', 'plan', 'scale', 'ouvrages', 'color', 'trace', 'chiffrage', 'scene3d',
    ])
  })
})
