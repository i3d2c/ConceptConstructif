export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface CardPosition {
  top: number
  left: number
}

export const CARD_MARGIN = 16
export const CARD_WIDTH = 320

export function computeCardPosition(
  target: Rect,
  cardSize: Size,
  viewport: Size,
  placement: string,
): CardPosition {
  if (placement === 'right') {
    const left = Math.min(target.x + target.width + CARD_MARGIN, viewport.width - cardSize.width - CARD_MARGIN)
    const maxTop = viewport.height - cardSize.height - CARD_MARGIN
    const top = Math.min(Math.max(CARD_MARGIN, target.y), Math.max(CARD_MARGIN, maxTop))
    return { top, left: Math.max(CARD_MARGIN, left) }
  }
  return { top: target.y + target.height + CARD_MARGIN, left: target.x }
}
