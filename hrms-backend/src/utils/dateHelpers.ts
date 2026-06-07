import { getDaysInMonth, getDay } from 'date-fns'

export function getWorkingDaysInMonth(monthStr: string): number {
  const [year, month] = monthStr.split('-').map(Number)
  const totalDays = getDaysInMonth(new Date(year, month - 1))
  let working = 0
  for (let d = 1; d <= totalDays; d++) {
    const day = getDay(new Date(year, month - 1, d))
    if (day !== 0 && day !== 6) working++
  }
  return working
}

export function calcHoursWorked(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime()
  return Math.round((ms / 3_600_000) * 100) / 100
}
