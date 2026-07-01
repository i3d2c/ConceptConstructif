export interface BaseTrace {
  id: string
  number: number
  colorAssignmentId: string
  up: number
  points: [number, number][]
}

export interface LineTrace extends BaseTrace {
  type: 'line'
}

export interface SurfaceTrace extends BaseTrace {
  type: 'surface'
  angle?: number
}

export type Trace = LineTrace | SurfaceTrace
