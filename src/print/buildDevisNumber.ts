function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function buildDevisNumber(date: Date): string {
  const yy = pad2(date.getFullYear() % 100)
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()

  return `${yy}${mm}${dd}${secondsSinceMidnight}`
}
