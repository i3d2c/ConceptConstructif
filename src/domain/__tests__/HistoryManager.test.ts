import { describe, it, expect, beforeEach } from 'vitest'
import { HistoryManager } from '../services/HistoryManager'
import type { Project } from '../models/Project'

const makeProject = (name: string): Project => ({
  id: 'p-1',
  name,
  ouvrages: [],
  constituents: [],
  zones: [],
  activeZoneId: '',
  createdAt: '',
  updatedAt: '',
})

describe('HistoryManager', () => {
  let history: HistoryManager

  beforeEach(() => {
    history = new HistoryManager(20)
  })

  it('canUndo est false initialement', () => {
    expect(history.canUndo).toBe(false)
  })

  it('canUndo est true après un push', () => {
    history.push(makeProject('v1'))
    expect(history.canUndo).toBe(true)
  })

  it('undo restaure le snapshot précédent', () => {
    const v1 = makeProject('v1')
    const v2 = makeProject('v2')
    history.push(v1)
    const restored = history.undo(v2)
    expect(restored?.name).toBe('v1')
  })

  it('redo restaure après un undo', () => {
    const v1 = makeProject('v1')
    const v2 = makeProject('v2')
    history.push(v1)
    const afterUndo = history.undo(v2)!
    const afterRedo = history.redo(afterUndo)
    expect(afterRedo?.name).toBe('v2')
  })

  it('push efface le futur', () => {
    history.push(makeProject('v1'))
    history.undo(makeProject('v2'))
    expect(history.canRedo).toBe(true)
    history.push(makeProject('v3'))
    expect(history.canRedo).toBe(false)
  })

  it('respecte la limite maximale de snapshots', () => {
    const small = new HistoryManager(3)
    small.push(makeProject('v1'))
    small.push(makeProject('v2'))
    small.push(makeProject('v3'))
    small.push(makeProject('v4'))
    // pile pleine à 3 : v2, v3, v4 (v1 éjecté)
    const r1 = small.undo(makeProject('v5'))
    const r2 = small.undo(r1!)
    const r3 = small.undo(r2!)
    expect(r3?.name).toBe('v2')
    expect(small.canUndo).toBe(false)
  })
})
