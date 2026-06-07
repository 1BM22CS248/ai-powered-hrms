import { format, parseISO, formatDistanceToNow } from 'date-fns'

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '—'
  try {
    return format(parseISO(isoDate), 'dd MMM yyyy')
  } catch {
    return isoDate
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '—'
  try {
    return format(parseISO(isoString), 'dd MMM yyyy, hh:mm a')
  } catch {
    return isoString
  }
}

export function formatMonth(yyyyMm: string): string {
  if (!yyyyMm) return '—'
  try {
    return format(parseISO(yyyyMm + '-01'), 'MMMM yyyy')
  } catch {
    return yyyyMm
  }
}

export function formatHours(decimalHours: number): string {
  const h = Math.floor(decimalHours)
  const m = Math.round((decimalHours - h) * 60)
  return `${h}h ${m}m`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatRelative(isoString: string): string {
  if (!isoString) return '—'
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true })
  } catch {
    return isoString
  }
}

export function formatDays(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
