export interface BaseTrace {
  id: string
  number: number
  colorAssignmentId: string
  up: number
  points: [number, number][]
}

export interface ProfilePoint {
  at: number
  offset: number
}

export interface LineTrace extends BaseTrace {
  type: 'line'
  profile: ProfilePoint[]
}

export type SlopeDirection = 'top' | 'bottom' | 'left' | 'right'

export interface SurfaceTrace extends BaseTrace {
  type: 'surface'
  angle: number
  slopeDirection: SlopeDirection
}

export type Trace = LineTrace | SurfaceTrace
