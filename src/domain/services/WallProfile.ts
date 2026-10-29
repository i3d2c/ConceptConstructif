import type { ProfilePoint } from '../models/Trace'

export function defaultProfile(): ProfilePoint[] {
  return [{ at: 0, offset: 0 }, { at: 1, offset: 0 }]
}

export function profileArea(profile: ProfilePoint[], length: number, baseHeight: number): number {
  let area = 0
  for (let i = 0; i < profile.length - 1; i++) {
    const width = (profile[i + 1].at - profile[i].at) * length
    area += width * (2 * baseHeight + profile[i].offset + profile[i + 1].offset) / 2
  }
  return area
}

export function profileMaxHeight(profile: ProfilePoint[], baseHeight: number): number {
  return baseHeight + Math.max(...profile.map(p => p.offset))
}
