import { describe, it, expect } from 'vitest'
import { capturePrintSnapshot } from '../capturePrintSnapshot'

describe('capturePrintSnapshot', () => {
  it('Should return null without touching the DOM when the active zone has no scale', async () => {
    const result = await capturePrintSnapshot({ activeZone: undefined, bgLayout: null })

    expect(result).toBeNull()
  })
})
