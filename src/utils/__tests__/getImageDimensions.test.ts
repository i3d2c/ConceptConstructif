import { describe, it, expect, afterEach } from 'vitest'
import { getImageDimensions } from '../getImageDimensions'

describe('getImageDimensions', () => {
  const OriginalImage = global.Image

  afterEach(() => {
    global.Image = OriginalImage
  })

  it('Should resolve with the natural width and height once the image loads', async () => {
    class FakeImage {
      naturalWidth = 300
      naturalHeight = 150
      onload: (() => void) | null = null
      onerror: ((err: unknown) => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    // @ts-expect-error test double replacing the global Image constructor
    global.Image = FakeImage

    const dimensions = await getImageDimensions('data:image/png;base64,fake')

    expect(dimensions).toEqual({ width: 300, height: 150 })
  })

  it('Should reject when the image fails to load', async () => {
    class FailingImage {
      onload: (() => void) | null = null
      onerror: ((err: unknown) => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.(new Error('broken image')))
      }
    }
    // @ts-expect-error test double replacing the global Image constructor
    global.Image = FailingImage

    await expect(getImageDimensions('data:image/png;base64,broken')).rejects.toThrow('broken image')
  })
})
