export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '—'
  if (size < 1024) return `${Math.round(size)} B`
  const kb = size / 1024
  if (kb < 1024) return `${trimNumber(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${trimNumber(mb)} MB`
  return `${trimNumber(mb / 1024)} GB`
}

function trimNumber(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1)
}
