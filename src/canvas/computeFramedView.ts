export interface FramedView {
  scale: number
  x: number
  y: number
}

const MIN_SIZE_PX = 50

export function computeFramedView(
  points: [number, number][],
  containerWidth: number,
  containerHeight: number,
  marginRatio = 0.08,
): FramedView | null {
  if (points.length === 0) return null

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  const width = Math.max(maxX - minX, MIN_SIZE_PX)
  const height = Math.max(maxY - minY, MIN_SIZE_PX)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  const framedWidth = width * (1 + 2 * marginRatio)
  const framedHeight = height * (1 + 2 * marginRatio)
  const scale = Math.min(containerWidth / framedWidth, containerHeight / framedHeight)

  return {
    scale,
    x: containerWidth / 2 - cx * scale,
    y: containerHeight / 2 - cy * scale,
  }
}
