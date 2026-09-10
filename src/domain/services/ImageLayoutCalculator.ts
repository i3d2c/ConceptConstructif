export interface ImageLayout {
  x: number
  y: number
  w: number
  h: number
}

export function computeCenteredImageLayout(
  stageWidth: number,
  stageHeight: number,
  imageWidth: number,
  imageHeight: number,
): ImageLayout {
  const maxW = stageWidth * 0.9
  const maxH = stageHeight * 0.9
  const scale = Math.min(maxW / imageWidth, maxH / imageHeight)
  const w = imageWidth * scale
  const h = imageHeight * scale
  return { x: (stageWidth - w) / 2, y: (stageHeight - h) / 2, w, h }
}
