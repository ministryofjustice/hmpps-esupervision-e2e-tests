import { DateTime } from 'luxon'

export const today = DateTime.now()
export const tomorrow = today.plus({ days: 1 })
export const nextWeek = today.plus({ weeks: 1 })

export const dueDateString = (date: DateTime) : string => {
    console.log(date.toFormat("yyyy-M-d"))
    return date.toFormat("yyyy-M-d")
}

export const dobParts = (dob: Date): { day: string; month: string; year: string } => ({
  day: dob.getDate().toString(),
  month: (dob.getMonth() + 1).toString(),
  year: dob.getFullYear().toString(),
})