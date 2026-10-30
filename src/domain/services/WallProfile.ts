import type { ProfilePoint } from '../models/Trace'

export function defaultProfile(): ProfilePoint[] {
  return [{ at: 0, offset: 0 }, { at: 1, offset: 0 }]
}

export function profileMeanHeight(profile: ProfilePoint[], baseHeight: number): number {
  let meanOffset = 0
  for (let i = 0; i < profile.length - 1; i++) {
    meanOffset += (profile[i + 1].at - profile[i].at) * (profile[i].offset + profile[i + 1].offset) / 2
  }
  return baseHeight + meanOffset
}

export function profileMaxHeight(profile: ProfilePoint[], baseHeight: number): number {
  return baseHeight + Math.max(...profile.map(p => p.offset))
}
