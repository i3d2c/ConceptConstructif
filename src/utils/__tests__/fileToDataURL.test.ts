import { describe, it, expect } from 'vitest'
import { fileToDataURL } from '../fileToDataURL'

describe('fileToDataURL', () => {
  it('Should resolve with a data URL for the given file content', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

    const dataUrl = await fileToDataURL(file)

    expect(dataUrl).toMatch(/^data:text\/plain;base64,/)
  })
})
