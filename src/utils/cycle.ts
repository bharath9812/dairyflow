import { SupabaseClient } from '@supabase/supabase-js'

export interface CycleConfig {
  c1StartDay: number
  c1EndDay: number
}

export const fetchCycleConfig = async (supabase: SupabaseClient): Promise<CycleConfig> => {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('id', 'cycle_config')
    .single()
    
  return {
    c1StartDay: data?.value?.c1StartDay || 1,
    c1EndDay: data?.value?.c1EndDay || 14
  }
}

export const getCycleIdentifierFromDate = (date: Date, config: CycleConfig) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (day >= config.c1StartDay && day <= config.c1EndDay) {
    return `${year}-${String(month).padStart(2, '0')}-C1`
  } else if (day > config.c1EndDay) {
    return `${year}-${String(month).padStart(2, '0')}-C2`
  } else {
    // day < c1StartDay, belongs to previous month's C2
    let prevMonth = month - 1
    let prevYear = year
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear -= 1
    }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}-C2`
  }
}

export const getCurrentCycle = (config: CycleConfig) => {
  return getCycleIdentifierFromDate(new Date(), config)
}

export const getPreviousCycle = (config: CycleConfig) => {
  const currentCycle = getCurrentCycle(config)
  const [yearStr, monthStr, c] = currentCycle.split('-')
  let year = parseInt(yearStr)
  let month = parseInt(monthStr)

  if (c === 'C2') {
    return `${year}-${String(month).padStart(2, '0')}-C1`
  } else {
    month -= 1
    if (month === 0) {
      month = 12
      year -= 1
    }
    return `${year}-${String(month).padStart(2, '0')}-C2`
  }
}

export const getCycleLabel = (cycleIdentifier: string, config: CycleConfig = { c1StartDay: 1, c1EndDay: 14 }) => {
  const { startDate, endDate } = getCycleDates(cycleIdentifier, config)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const formatObj = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${formatObj.format(start)} - ${formatObj.format(end)}`
}

export const getCycleDates = (cycleIdentifier: string, config: CycleConfig = { c1StartDay: 1, c1EndDay: 14 }) => {
  const [yearStr, monthStr, cycle] = cycleIdentifier.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr)

  if (cycle === 'C1') {
    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(config.c1StartDay).padStart(2, '0')}`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(config.c1EndDay).padStart(2, '0')}`
    return { startDate, endDate }
  } else {
    // C2 starts on c1EndDay + 1
    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(config.c1EndDay + 1).padStart(2, '0')}`
    
    // C2 ends on next month c1StartDay - 1, OR end of current month if c1StartDay == 1
    if (config.c1StartDay === 1) {
      const endOfMonth = new Date(year, month, 0)
      const endDate = endOfMonth.toISOString().split('T')[0]
      return { startDate, endDate }
    } else {
      let nextMonth = month + 1
      let nextYear = year
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(config.c1StartDay - 1).padStart(2, '0')}`
      return { startDate, endDate }
    }
  }
}

export const getCyclesActive = (startDateStr: string, config: CycleConfig) => {
  const startCycle = getCycleIdentifierFromDate(new Date(startDateStr), config)
  const currentCycle = getCurrentCycle(config)
  
  // If the loan starts in the future (unlikely but safe check)
  if (startCycle > currentCycle) return 0
  
  let count = 1
  let [yearStr, monthStr, c] = startCycle.split('-')
  let year = parseInt(yearStr)
  let month = parseInt(monthStr)
  
  let currentIdentifier = startCycle
  
  let guard = 0
  while (currentIdentifier !== currentCycle && guard < 500) {
    guard++
    count++
    if (c === 'C1') {
      c = 'C2'
    } else {
      c = 'C1'
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
    currentIdentifier = `${year}-${String(month).padStart(2, '0')}-${c}`
  }
  
  return count
}
