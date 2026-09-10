type ScaleTracePoints = [[number, number], [number, number]]

export function moveScalePoint(tracePoints: ScaleTracePoints, pointIdx: 0 | 1, dx: number, dy: number): ScaleTracePoints {
  const moved: [number, number] = [tracePoints[pointIdx][0] + dx, tracePoints[pointIdx][1] + dy]
  const result: ScaleTracePoints = [tracePoints[0], tracePoints[1]]
  result[pointIdx] = moved
  return result
}

export function moveScaleLine(tracePoints: ScaleTracePoints, dx: number, dy: number): ScaleTracePoints {
  return [
    [tracePoints[0][0] + dx, tracePoints[0][1] + dy],
    [tracePoints[1][0] + dx, tracePoints[1][1] + dy],
  ]
}
