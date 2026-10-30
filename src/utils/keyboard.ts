export function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

export function isTraceDeleteKey(e: KeyboardEvent): boolean {
  return (e.key === 'Delete' || e.key === 'Backspace') && !isEditableTarget(e.target)
}

export function historyShortcut(e: KeyboardEvent): 'undo' | 'redo' | null {
  if (!(e.ctrlKey || e.metaKey) || isEditableTarget(e.target)) return null
  const key = e.key.toLowerCase()
  if (key === 'z' && !e.shiftKey) return 'undo'
  if (key === 'y' || (key === 'z' && e.shiftKey)) return 'redo'
  return null
}
