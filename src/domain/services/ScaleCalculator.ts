import type { Scale } from '../models/Scale'

export function buildScale(
  tracePoints: [[number, number], [number, number]],
  realLength: number,
): Scale {
  const dx = tracePoints[1][0] - tracePoints[0][0]
  const dy = tracePoints[1][1] - tracePoints[0][1]
  const pixelLength = Math.sqrt(dx * dx + dy * dy)
  const ratio = realLength / pixelLength
  return { pixelLength, realLength, ratio, tracePoints }
}

export function pixelsToMeters(pixels: number, ratio: number): number {
  return pixels * ratio
}
