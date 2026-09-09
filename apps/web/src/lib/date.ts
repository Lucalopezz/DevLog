import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMMM d, yyyy", { locale: enUS })
}

export function formatRelativeDate(date: Date | string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: enUS,
  })
}
