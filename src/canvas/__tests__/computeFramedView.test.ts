import { describe, it, expect } from 'vitest'
import { computeFramedView } from '../computeFramedView'

describe('computeFramedView', () => {
  it('Should return null when there are no points to frame', () => {
    const result = computeFramedView([], 800, 600)

    expect(result).toBeNull()
  })

  it('Should center the bounding box of the points in the container', () => {
    const points: [number, number][] = [[100, 200], [300, 400]]

    const result = computeFramedView(points, 800, 600, 0)

    // bbox center is (200, 300); at the returned scale, it must land on the container center
    expect(result!.x + 200 * result!.scale).toBeCloseTo(400)
    expect(result!.y + 300 * result!.scale).toBeCloseTo(300)
  })

  it('Should scale the bounding box to fill the container on its limiting axis, with no margin', () => {
    const points: [number, number][] = [[0, 0], [400, 200]]

    const result = computeFramedView(points, 800, 600, 0)

    // bbox is 400x200 (ratio 2:1), container is 800x600 (ratio 4:3): width is the limiting axis
    expect(result!.scale).toBeCloseTo(2)
  })

  it('Should shrink the scale to leave room for the requested margin', () => {
    const points: [number, number][] = [[0, 0], [400, 200]]

    const withoutMargin = computeFramedView(points, 800, 600, 0)!
    const withMargin = computeFramedView(points, 800, 600, 0.1)!

    expect(withMargin.scale).toBeLessThan(withoutMargin.scale)
  })

  it('Should not divide by zero when all points are the same (a single-point trace)', () => {
    const result = computeFramedView([[50, 50]], 800, 600)

    expect(result).not.toBeNull()
    expect(Number.isFinite(result!.scale)).toBe(true)
  })
})
