import { describe, it, expect } from 'vitest'
import { computeFramingCamera } from '../cameraFraming'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { Zone, ColorAssignment } from '../../domain/models/Zone'
import type { Scale } from '../../domain/models/Scale'
import type { Trace } from '../../domain/models/Trace'

const SCALE: Scale = { pixelLength: 1, realLength: 1, ratio: 1, tracePoints: [[0, 0], [1, 0]] }
const COLOR_ASSIGNMENTS: ColorAssignment[] = [{ id: 'ca1', color: '#fff', ouvrageId: 'o1', epaisseur: 1, hauteur: 2.5 }]

function surfaceTrace(points: [number, number][], colorAssignmentId = 'ca1', up = 0): Trace {
  return { id: 't1', number: 1, colorAssignmentId, up, points, type: 'surface', angle: 0, slopeDirection: 'top' }
}

function zoneWith(traces: Trace[], colorAssignments = COLOR_ASSIGNMENTS): Zone {
  return { id: 'z1', name: 'Zone', scale: SCALE, backgroundImage: null, backgroundImageLayout: null, colorAssignments, traces, printConfig: defaultPrintConfig() }
}

describe('computeFramingCamera', () => {
  it('should return null when the zone has no traces', () => {
    expect(computeFramingCamera(zoneWith([]), SCALE, 60)).toBeNull()
  })

  it('should center the target on the bounding box of the trace points', () => {
    const zone = zoneWith([surfaceTrace([[0, 0], [10, 0], [10, 10], [0, 10]])])
    const framing = computeFramingCamera(zone, SCALE, 60)
    expect(framing?.target.x).toBeCloseTo(5)
    expect(framing?.target.z).toBeCloseTo(5)
  })

  it('should position the camera above the target (plongée, not contre-plongée)', () => {
    const zone = zoneWith([surfaceTrace([[0, 0], [10, 0], [10, 10], [0, 10]])])
    const framing = computeFramingCamera(zone, SCALE, 60)!
    expect(framing.position.y).toBeGreaterThan(framing.target.y)
  })

  it('should move the camera further away as the plan grows larger', () => {
    const small = zoneWith([surfaceTrace([[0, 0], [10, 0], [10, 10], [0, 10]])])
    const large = zoneWith([surfaceTrace([[0, 0], [100, 0], [100, 100], [0, 100]])])
    const smallFraming = computeFramingCamera(small, SCALE, 60)!
    const largeFraming = computeFramingCamera(large, SCALE, 60)!
    const distanceOf = (f: NonNullable<typeof smallFraming>) =>
      Math.hypot(f.position.x - f.target.x, f.position.z - f.target.z)
    expect(distanceOf(largeFraming)).toBeGreaterThan(distanceOf(smallFraming))
  })

  it('should ignore traces without a matching color assignment', () => {
    const validTrace = surfaceTrace([[0, 0], [10, 0], [10, 10], [0, 10]], 'ca1')
    const orphanTrace = surfaceTrace([[1000, 1000], [1010, 1000], [1010, 1010], [1000, 1010]], 'missing')
    const zone = zoneWith([validTrace, orphanTrace])
    const framing = computeFramingCamera(zone, SCALE, 60)
    expect(framing?.target.x).toBeCloseTo(5)
    expect(framing?.target.z).toBeCloseTo(5)
  })
})
