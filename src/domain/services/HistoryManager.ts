import type { Project } from '../models/Project'

export class HistoryManager {
  private past: string[] = []
  private future: string[] = []
  private readonly maxSize: number

  constructor(maxSize = 20) {
    this.maxSize = maxSize
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  push(project: Project): void {
    this.past.push(JSON.stringify(project))
    if (this.past.length > this.maxSize) {
      this.past.shift()
    }
    this.future = []
  }

  undo(current: Project): Project | null {
    const snapshot = this.past.pop()
    if (!snapshot) return null
    this.future.push(JSON.stringify(current))
    return JSON.parse(snapshot) as Project
  }

  redo(current: Project): Project | null {
    const snapshot = this.future.pop()
    if (!snapshot) return null
    this.past.push(JSON.stringify(current))
    return JSON.parse(snapshot) as Project
  }
}
