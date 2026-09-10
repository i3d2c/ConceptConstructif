import { describe, it, expect } from 'vitest'
import { computeCenteredImageLayout } from '../services/ImageLayoutCalculator'

describe('computeCenteredImageLayout', () => {
  it('Should scale to fit the stage width and center the image when width is the constraining dimension', () => {
    const layout = computeCenteredImageLayout(800, 600, 400, 100)
    expect(layout).toEqual({ x: 40, y: 210, w: 720, h: 180 })
  })

  it('Should scale to fit the stage height and center the image when height is the constraining dimension', () => {
    const layout = computeCenteredImageLayout(800, 600, 100, 1000)
    expect(layout).toEqual({ x: 373, y: 30, w: 54, h: 540 })
  })

  it('Should keep the image within 90% of the stage size', () => {
    const layout = computeCenteredImageLayout(1000, 1000, 1000, 1000)
    expect(layout).toEqual({ x: 50, y: 50, w: 900, h: 900 })
  })
})
