import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(km: number | null): string {
  if (km == null) return 'online'
  if (km < 1) return 'menej než 1 km'
  return `${Math.round(km)} km`
}
