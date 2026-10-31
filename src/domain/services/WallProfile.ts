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

export function profileHeightAt(profile: ProfilePoint[], at: number, baseHeight: number): number {
  const next = profile.findIndex(p => p.at >= at)
  if (next === 0) return baseHeight + profile[0].offset
  const a = profile[next - 1]
  const b = profile[next]
  const t = (at - a.at) / (b.at - a.at)
  return baseHeight + a.offset + t * (b.offset - a.offset)
}

export function insertProfilePoint(profile: ProfilePoint[], at: number, minGap: number): ProfilePoint[] {
  if (at <= 0 || at >= 1 || profile.some(p => Math.abs(p.at - at) < minGap)) return profile
  const next = profile.findIndex(p => p.at > at)
  const point = { at, offset: profileHeightAt(profile, at, 0) }
  return [...profile.slice(0, next), point, ...profile.slice(next)]
}

export function removeProfilePoint(profile: ProfilePoint[], index: number): ProfilePoint[] {
  if (index <= 0 || index >= profile.length - 1) return profile
  return profile.filter((_, i) => i !== index)
}

export function moveProfilePoint(
  profile: ProfilePoint[],
  index: number,
  at: number,
  offset: number,
  minGap: number,
): ProfilePoint[] {
  const isEnd = index === 0 || index === profile.length - 1
  const clampedAt = isEnd
    ? profile[index].at
    : Math.min(Math.max(at, profile[index - 1].at + minGap), profile[index + 1].at - minGap)
  return profile.map((p, i) => (i === index ? { at: clampedAt, offset } : p))
}
