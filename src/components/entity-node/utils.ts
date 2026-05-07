export const getDurationLabel = (duration: string) => {
  if (duration === '1d') return '1 day'
  if (duration === '7d') return '1 week'
  if (duration === '30d') return '4 weeks'
  if (duration === '90d') return '13 weeks'
  if (duration === '365d') return '52 weeks'
  return duration
}
