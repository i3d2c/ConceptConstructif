import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { wallProfileOutline, placeWallSegment } from '../wallProfileOutline'

const gable = [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }]

describe('wallProfileOutline', () => {
  it('should outline a gable wall as its base followed by its top, from end back to start', () => {
    expect(wallProfileOutline(gable, 2.5, 10, 0, 1)).toEqual([
      [0, 0], [10, 0], [10, 2.5], [5, 5], [0, 2.5],
    ])
  })

  it('should outline only the slice of the profile covered by one segment of the wall', () => {
    expect(wallProfileOutline(gable, 2.5, 10, 0.25, 0.75)).toEqual([
      [0, 0], [5, 0], [5, 3.75], [2.5, 5], [0, 3.75],
    ])
  })
})

describe('placeWallSegment', () => {
  function worldOf(obj: THREE.Object3D, local: [number, number, number]) {
    obj.updateMatrixWorld()
    return obj.localToWorld(new THREE.Vector3(...local))
  }

  it('should map the local wall axis onto the segment, from its start to its end', () => {
    const obj = new THREE.Object3D()
    placeWallSegment(obj, [1, 2], [4, 6], 0)
    const end = worldOf(obj, [5, 0, 0])
    expect(end.x).toBeCloseTo(4)
    expect(end.z).toBeCloseTo(6)
  })

  it('should keep local heights vertical, raised by the trace elevation', () => {
    const obj = new THREE.Object3D()
    placeWallSegment(obj, [1, 2], [4, 6], 0.5)
    const top = worldOf(obj, [0, 3, 0])
    expect(top.x).toBeCloseTo(1)
    expect(top.y).toBeCloseTo(3.5)
    expect(top.z).toBeCloseTo(2)
  })
})
