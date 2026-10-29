import type { SlopeDirection, SurfaceTrace } from '../models/Trace'

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

export function slopeStretch(direction: SlopeDirection, angleRad: number): { x: number; y: number } {
  const cosA = Math.max(Math.cos(angleRad), 1e-6)
  return {
    x: direction === 'left' || direction === 'right' ? 1 / cosA : 1,
    y: direction === 'top' || direction === 'bottom' ? 1 / cosA : 1,
  }
}

export function surfaceStretch(trace: SurfaceTrace): { x: number; y: number } {
  return slopeStretch(trace.slopeDirection ?? 'top', ((trace.angle ?? 0) * Math.PI) / 180)
}
