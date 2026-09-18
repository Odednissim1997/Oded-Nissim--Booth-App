import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { RecruitmentStage } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const STAGE_COLORS: Record<RecruitmentStage, string> = {
  Applied: 'bg-blue-100 text-blue-700',
  'Phone Screen': 'bg-purple-100 text-purple-700',
  'First Round': 'bg-yellow-100 text-yellow-700',
  'Second Round': 'bg-orange-100 text-orange-700',
  'Final Round': 'bg-red-100 text-red-700',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-gray-100 text-gray-500',
  Withdrawn: 'bg-gray-100 text-gray-400',
}

export const STAGE_ORDER: RecruitmentStage[] = [
  'Applied',
  'Phone Screen',
  'First Round',
  'Second Round',
  'Final Round',
  'Offer',
  'Rejected',
  'Withdrawn',
]

export const WARMTH_LABELS = {
  1: 'Cold',
  2: 'Warm',
  3: 'Hot',
}

export const WARMTH_COLORS = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-yellow-50 text-yellow-600',
  3: 'bg-red-50 text-red-600',
}
