export function computePolygonArea(points: [number, number][]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % n]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area / 2)
}

export function applyAngle(projectedArea: number, angleDeg: number): number {
  if (angleDeg === 0) return projectedArea
  const rad = (angleDeg * Math.PI) / 180
  return projectedArea / Math.cos(rad)
}
