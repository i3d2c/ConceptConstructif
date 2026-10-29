import type * as THREE from 'three'
import type { ProfilePoint } from '../domain/models/Trace'
import { profileHeightAt } from '../domain/services/WallProfile'

export function wallProfileOutline(
  profile: ProfilePoint[],
  baseHeight: number,
  wallLength: number,
  fromAt: number,
  toAt: number,
): [number, number][] {
  const topAts = [fromAt, ...profile.map(p => p.at).filter(at => at > fromAt && at < toAt), toAt]
  const top = topAts.map((at): [number, number] => [(at - fromAt) * wallLength, profileHeightAt(profile, at, baseHeight)])
  return [[0, 0], [(toAt - fromAt) * wallLength, 0], ...top.reverse()]
}

export function placeWallSegment(obj: THREE.Object3D, start: [number, number], end: [number, number], up: number) {
  obj.position.set(start[0], up, start[1])
  obj.rotation.y = -Math.atan2(end[1] - start[1], end[0] - start[0])
}
