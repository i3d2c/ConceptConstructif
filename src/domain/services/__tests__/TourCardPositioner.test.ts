import { describe, it, expect } from 'vitest'
import { computeCardPosition, CARD_MARGIN, CARD_WIDTH } from '../TourCardPositioner'

describe('computeCardPosition', () => {
  describe('with a "right" placement', () => {
    it('Should place the card to the right of the target, aligned with its top', () => {
      const target = { x: 100, y: 200, width: 50, height: 30 }
      const cardSize = { width: CARD_WIDTH, height: 150 }
      const viewport = { width: 1600, height: 900 }

      const position = computeCardPosition(target, cardSize, viewport, 'right')

      expect(position).toEqual({ top: 200, left: 100 + 50 + CARD_MARGIN })
    })

    it('Should clamp the top so the card never overflows the bottom of the viewport', () => {
      const target = { x: 100, y: 860, width: 50, height: 30 }
      const cardSize = { width: CARD_WIDTH, height: 180 }
      const viewport = { width: 1600, height: 900 }

      const position = computeCardPosition(target, cardSize, viewport, 'right')

      expect(position.top).toBe(viewport.height - cardSize.height - CARD_MARGIN)
    })

    it('Should clamp the left so the card never overflows the right edge of the viewport', () => {
      const target = { x: 1500, y: 200, width: 50, height: 30 }
      const cardSize = { width: CARD_WIDTH, height: 150 }
      const viewport = { width: 1600, height: 900 }

      const position = computeCardPosition(target, cardSize, viewport, 'right')

      expect(position.left).toBe(viewport.width - cardSize.width - CARD_MARGIN)
    })

    it('Should never place the card above the top margin, even for a very short target', () => {
      const target = { x: 100, y: -50, width: 50, height: 10 }
      const cardSize = { width: CARD_WIDTH, height: 150 }
      const viewport = { width: 1600, height: 900 }

      const position = computeCardPosition(target, cardSize, viewport, 'right')

      expect(position.top).toBe(CARD_MARGIN)
    })
  })

  describe('with any other placement', () => {
    it('Should place the card below the target, aligned with its left edge', () => {
      const target = { x: 100, y: 200, width: 50, height: 30 }
      const cardSize = { width: CARD_WIDTH, height: 150 }
      const viewport = { width: 1600, height: 900 }

      const position = computeCardPosition(target, cardSize, viewport, 'bottom')

      expect(position).toEqual({ top: 200 + 30 + CARD_MARGIN, left: 100 })
    })
  })
})
