import { describe, it, expect } from 'vitest'
import { duplicateZone } from '../services/ZoneDuplicator'
import type { Zone } from '../models/Zone'

const baseZone: Zone = {
  id: 'z-1',
  name: 'Option A',
  scale: {
    pixelLength: 100,
    realLength: 5,
    ratio: 0.05,
    tracePoints: [[10, 20], [110, 20]],
  },
  backgroundImage: null,
  colorAssignments: [
    { id: 'ca-1', color: '#ff0000', ouvrageId: 'o-1', epaisseur: 0.105, hauteur: 2.5 },
  ],
  traces: [
    { id: 't-1', type: 'line', number: 1, colorAssignmentId: 'ca-1', up: 0, points: [[0, 0], [60, 0]] },
  ],
}

describe('ZoneDuplicator', () => {
  it('crée une zone avec un nouvel id', () => {
    const copy = duplicateZone(baseZone, 'z-copy')
    expect(copy.id).toBe('z-copy')
    expect(copy.id).not.toBe(baseZone.id)
  })

  it('effectue une copie profonde — modifier la copie ne touche pas l\'original', () => {
    const copy = duplicateZone(baseZone, 'z-copy')
    copy.colorAssignments[0].color = '#0000ff'
    expect(baseZone.colorAssignments[0].color).toBe('#ff0000')
  })

  it('duplique le scale incluant tracePoints', () => {
    const copy = duplicateZone(baseZone, 'z-copy')
    expect(copy.scale).not.toBeNull()
    expect(copy.scale!.tracePoints).toEqual([[10, 20], [110, 20]])
    expect(copy.scale!.ratio).toBe(0.05)
  })

  it('utilise le nom fourni ou génère un nom par défaut', () => {
    const withName = duplicateZone(baseZone, 'z-copy', 'Option B')
    expect(withName.name).toBe('Option B')

    const withDefault = duplicateZone(baseZone, 'z-copy2')
    expect(withDefault.name).toBe('Option A (copie)')
  })
})
