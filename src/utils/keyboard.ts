export function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

export function isTraceDeleteKey(e: KeyboardEvent): boolean {
  return (e.key === 'Delete' || e.key === 'Backspace') && !isEditableTarget(e.target)
}
