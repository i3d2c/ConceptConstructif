import { describe, it, expect } from 'vitest'
import { moveScalePoint, moveScaleLine } from '../services/ScaleDragCalculator'

describe('moveScalePoint', () => {
  it('Should move only the targeted endpoint by dx/dy', () => {
    const result = moveScalePoint([[0, 0], [100, 0]], 1, 10, 5)
    expect(result).toEqual([[0, 0], [110, 5]])
  })

  it('Should leave the other endpoint unchanged', () => {
    const result = moveScalePoint([[0, 0], [100, 0]], 0, -10, 5)
    expect(result[1]).toEqual([100, 0])
  })
})

describe('moveScaleLine', () => {
  it('Should translate both endpoints by the same dx/dy', () => {
    const result = moveScaleLine([[0, 0], [100, 0]], 10, 5)
    expect(result).toEqual([[10, 5], [110, 5]])
  })
})
