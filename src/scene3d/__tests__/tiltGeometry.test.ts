import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { tiltScale, applyTilt } from '../tiltGeometry'

const ANGLE = Math.PI / 4 // 45°, cos = sin = √2/2

function tiltedPoint(direction: Parameters<typeof applyTilt>[2], angleRad: number, local: [number, number, number]) {
  const obj = new THREE.Object3D()
  applyTilt(obj, angleRad, direction)
  return new THREE.Vector3(...local).applyQuaternion(obj.quaternion)
}

describe('tiltScale', () => {
  it('should stretch the Z axis by 1/cos(angle) and leave X unchanged for top/bottom', () => {
    for (const dir of ['top', 'bottom'] as const) {
      const s = tiltScale(dir, ANGLE)
      expect(s.x).toBe(1)
      expect(s.z).toBeCloseTo(Math.SQRT2)
    }
  })

  it('should stretch the X axis by 1/cos(angle) and leave Z unchanged for left/right', () => {
    for (const dir of ['left', 'right'] as const) {
      const s = tiltScale(dir, ANGLE)
      expect(s.x).toBeCloseTo(Math.SQRT2)
      expect(s.z).toBe(1)
    }
  })

  it('should return no scaling for any direction when angle is 0', () => {
    for (const dir of ['top', 'bottom', 'left', 'right'] as const) {
      expect(tiltScale(dir, 0)).toEqual({ x: 1, z: 1 })
    }
  })
})

describe('applyTilt', () => {
  it('should lower the top edge (negative local Z) and raise the opposite edge for direction "top"', () => {
    const top = tiltedPoint('top', ANGLE, [0, -1, 0])
    expect(top.y).toBeCloseTo(-Math.SQRT1_2)
    const bottom = tiltedPoint('top', ANGLE, [0, 1, 0])
    expect(bottom.y).toBeCloseTo(Math.SQRT1_2)
  })

  it('should raise the top edge and lower the opposite edge for direction "bottom" (mirrored)', () => {
    const top = tiltedPoint('bottom', ANGLE, [0, -1, 0])
    expect(top.y).toBeCloseTo(Math.SQRT1_2)
    const bottom = tiltedPoint('bottom', ANGLE, [0, 1, 0])
    expect(bottom.y).toBeCloseTo(-Math.SQRT1_2)
  })

  it('should lower the left edge (negative local X) and raise the opposite edge for direction "left"', () => {
    const left = tiltedPoint('left', ANGLE, [-1, 0, 0])
    expect(left.y).toBeCloseTo(-Math.SQRT1_2)
    const right = tiltedPoint('left', ANGLE, [1, 0, 0])
    expect(right.y).toBeCloseTo(Math.SQRT1_2)
  })

  it('should raise the left edge and lower the opposite edge for direction "right" (mirrored)', () => {
    const left = tiltedPoint('right', ANGLE, [-1, 0, 0])
    expect(left.y).toBeCloseTo(Math.SQRT1_2)
    const right = tiltedPoint('right', ANGLE, [1, 0, 0])
    expect(right.y).toBeCloseTo(-Math.SQRT1_2)
  })

  it('should produce the same flat orientation for all 4 directions when angle is 0', () => {
    const flat = tiltedPoint('top', 0, [1, 1, 1])
    for (const dir of ['bottom', 'left', 'right'] as const) {
      const other = tiltedPoint(dir, 0, [1, 1, 1])
      expect(other.x).toBeCloseTo(flat.x)
      expect(other.y).toBeCloseTo(flat.y)
      expect(other.z).toBeCloseTo(flat.z)
    }
  })
})

describe('tiltScale + applyTilt combined', () => {
  it('should preserve the original footprint (world Z) along the tilt axis for top/bottom', () => {
    const original = 2 // the drawn (projected) local coordinate, before compensation
    for (const dir of ['top', 'bottom'] as const) {
      const s = tiltScale(dir, ANGLE)
      const p = tiltedPoint(dir, ANGLE, [0, original * s.z, 0])
      expect(p.z).toBeCloseTo(original)
    }
  })

  it('should preserve the original footprint (world X) along the tilt axis for left/right', () => {
    const original = 2
    for (const dir of ['left', 'right'] as const) {
      const s = tiltScale(dir, ANGLE)
      const p = tiltedPoint(dir, ANGLE, [original * s.x, 0, 0])
      expect(p.x).toBeCloseTo(original)
    }
  })
})
