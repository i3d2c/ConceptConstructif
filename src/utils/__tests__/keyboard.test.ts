import { describe, it, expect } from 'vitest'
import { isTraceDeleteKey } from '../keyboard'

function keydownOn(target: Element, key: string): KeyboardEvent {
  document.body.appendChild(target)
  let received!: KeyboardEvent
  target.addEventListener('keydown', e => { received = e as KeyboardEvent })
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  target.remove()
  return received
}

describe('isTraceDeleteKey', () => {
  it('should ignore Backspace typed in a text field', () => {
    expect(isTraceDeleteKey(keydownOn(document.createElement('input'), 'Backspace'))).toBe(false)
  })

  it('should ignore Delete typed in a textarea', () => {
    expect(isTraceDeleteKey(keydownOn(document.createElement('textarea'), 'Delete'))).toBe(false)
  })

  it('should accept Delete and Backspace pressed outside any text field', () => {
    expect(isTraceDeleteKey(keydownOn(document.createElement('div'), 'Delete'))).toBe(true)
    expect(isTraceDeleteKey(keydownOn(document.createElement('div'), 'Backspace'))).toBe(true)
  })

  it('should ignore any other key', () => {
    expect(isTraceDeleteKey(keydownOn(document.createElement('div'), 'a'))).toBe(false)
  })
})
