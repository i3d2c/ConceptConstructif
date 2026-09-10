import type { Zone } from '../domain/models/Zone'
import type { Scale } from '../domain/models/Scale'

export interface CameraFraming {
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}

const ELEVATION_RAD = (35 * Math.PI) / 180
const AZIMUTH_RAD = Math.PI / 4
const FRAME_MARGIN = 1.4
const MIN_PLAN_SIZE = 5
const TARGET_HEIGHT_RATIO = 0.3

export function computeFramingCamera(zone: Zone, scale: Scale, fovDegrees: number): CameraFraming | null {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  let maxHeight = 0
  let hasPoints = false

  for (const trace of zone.traces) {
    const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
    if (!ca) continue

    const traceHeight = trace.up + (trace.type === 'line' ? ca.hauteur : ca.epaisseur)
    maxHeight = Math.max(maxHeight, traceHeight)

    for (const [px, py] of trace.points) {
      hasPoints = true
      const wx = px * scale.ratio
      const wz = py * scale.ratio
      minX = Math.min(minX, wx)
      maxX = Math.max(maxX, wx)
      minZ = Math.min(minZ, wz)
      maxZ = Math.max(maxZ, wz)
    }
  }

  if (!hasPoints) return null

  const cx = (minX + maxX) / 2
  const cz = (minZ + maxZ) / 2
  const targetY = maxHeight * TARGET_HEIGHT_RATIO

  const planSize = Math.max(maxX - minX, maxZ - minZ, MIN_PLAN_SIZE)
  const fovRad = (fovDegrees * Math.PI) / 180
  const distance = ((planSize / 2) / Math.tan(fovRad / 2)) * FRAME_MARGIN

  const horizontal = distance * Math.cos(ELEVATION_RAD)
  const vertical = distance * Math.sin(ELEVATION_RAD)

  return {
    position: {
      x: cx + horizontal * Math.cos(AZIMUTH_RAD),
      y: targetY + vertical,
      z: cz + horizontal * Math.sin(AZIMUTH_RAD),
    },
    target: { x: cx, y: targetY, z: cz },
  }
}
