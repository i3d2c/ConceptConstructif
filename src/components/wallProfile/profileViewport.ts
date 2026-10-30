import type { ProfilePoint } from '../../domain/models/Trace'
import { profileMaxHeight } from '../../domain/services/WallProfile'

export interface ViewportFrame {
  width: number
  height: number
  pad: number
}

export const PROFILE_FRAME: ViewportFrame = { width: 240, height: 140, pad: 12 }

const HEADROOM = 1.5

export function profileViewHeight(profile: ProfilePoint[], baseHeight: number): number {
  return Math.max(profileMaxHeight(profile, baseHeight), 1) * HEADROOM
}

export function createProfileViewport(wallLength: number, viewHeight: number, frame: ViewportFrame) {
  const scale = Math.min((frame.width - 2 * frame.pad) / wallLength, (frame.height - 2 * frame.pad) / viewHeight)
  const originY = frame.height - frame.pad
  return {
    scale,
    toSvg: (x: number, h: number): [number, number] => [frame.pad + x * scale, originY - h * scale],
    toWall: (sx: number, sy: number): [number, number] => [(sx - frame.pad) / scale, (originY - sy) / scale],
  }
}
