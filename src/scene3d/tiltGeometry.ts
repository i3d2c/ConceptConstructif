import * as THREE from 'three'
import type { SlopeDirection } from '../domain/models/Trace'

export function tiltScale(direction: SlopeDirection, angleRad: number): { x: number; z: number } {
  const cosA = Math.max(Math.cos(angleRad), 1e-6)
  return {
    x: direction === 'left' || direction === 'right' ? 1 / cosA : 1,
    z: direction === 'top' || direction === 'bottom' ? 1 / cosA : 1,
  }
}

export function applyTilt(mesh: THREE.Object3D, angleRad: number, direction: SlopeDirection) {
  if (direction === 'top' || direction === 'bottom') {
    const sign = direction === 'top' ? -1 : 1
    mesh.rotation.x = Math.PI / 2 + sign * angleRad
  } else {
    // The tilt axis (world Z) is perpendicular to the flatten axis (local X): a single
    // Euler rotation can't express this, since ExtrudeGeometry locks the thickness onto
    // the shape's local Z slot. Flatten first, then compose an additional world-space
    // rotation about Z, which still pivots through the mesh's own center (position offset
    // is applied separately, after this).
    mesh.rotation.x = Math.PI / 2
    const sign = direction === 'left' ? 1 : -1
    mesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), sign * angleRad)
  }
}
