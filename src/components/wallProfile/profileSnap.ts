const STEPS_PER_METRE = 20

function roundToStep(value: number): number {
  return Math.round(value * STEPS_PER_METRE) / STEPS_PER_METRE
}

export function snapHeight(height: number): number {
  return Math.max(0, roundToStep(height))
}

export function snapPosition(position: number, wallLength: number, magnetRadius: number): number {
  const middle = wallLength / 2
  return Math.abs(position - middle) <= magnetRadius ? middle : roundToStep(position)
}
