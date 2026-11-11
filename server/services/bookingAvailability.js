const twoHourIntervalMinutes = 120

export function getDailySchedule(date, override = null) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay()
  let openingTime
  let closingTime

  if (day === 0) {
    return { mode: override ?? 'default', openingTime: null, closingTime: null, slots: [] }
  } else if (day === 6) {
    openingTime = '09:00'
    closingTime = '17:00'
  } else {
    openingTime = '08:00'
    closingTime = '18:00'
  }

  if (override === 'closed') {
    return { mode: override, openingTime: null, closingTime: null, slots: [] }
  }

  const openingMinutes = toMinutes(openingTime)
  const closingMinutes = toMinutes(closingTime)
  const slots = []
  for (
    let start = openingMinutes;
    start + twoHourIntervalMinutes <= closingMinutes;
    start += twoHourIntervalMinutes
  ) {
    if (
      (override === 'morning' && start >= toMinutes('12:00')) ||
      (override === 'afternoon' && start < toMinutes('12:00'))
    ) {
      continue
    }
    slots.push(toTime(start))
  }

  return { mode: override ?? 'default', openingTime, closingTime, slots }
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
