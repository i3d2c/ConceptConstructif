import { describe, it, expect } from 'vitest'
import { isTraceDeleteKey, historyShortcut } from '../keyboard'

function keydownOn(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  document.body.appendChild(target)
  let received!: KeyboardEvent
  target.addEventListener('keydown', e => { received = e as KeyboardEvent })
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
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

describe('historyShortcut', () => {
  it('should leave Ctrl+Z to the text field being typed in', () => {
    expect(historyShortcut(keydownOn(document.createElement('input'), 'z', { ctrlKey: true }))).toBeNull()
  })

  it('should undo with Ctrl+Z and redo with Ctrl+Y outside any text field', () => {
    expect(historyShortcut(keydownOn(document.createElement('div'), 'z', { ctrlKey: true }))).toBe('undo')
    expect(historyShortcut(keydownOn(document.createElement('div'), 'y', { ctrlKey: true }))).toBe('redo')
  })

  it('should redo with Ctrl+Shift+Z, which browsers report as an uppercase Z', () => {
    expect(historyShortcut(keydownOn(document.createElement('div'), 'Z', { ctrlKey: true, shiftKey: true }))).toBe('redo')
  })

  it('should ignore Z without Ctrl or Cmd', () => {
    expect(historyShortcut(keydownOn(document.createElement('div'), 'z'))).toBeNull()
  })
})
