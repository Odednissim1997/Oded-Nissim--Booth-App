'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { QuickAddFAB } from '@/components/QuickAdd'
import { Badge } from '@/components/ui/Badge'
import { recruitmentStore, contactStore, deadlineStore } from '@/lib/store'
import { RecruitmentProcess, Deadline } from '@/types'
import { STAGE_COLORS, formatDate, daysUntil, cn } from '@/lib/utils'
import { Building2, Users, CalendarClock, Mail, CheckCircle2, Circle, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const [processes, setProcesses] = useState<RecruitmentProcess[]>([])
  const [contactCount, setContactCount] = useState(0)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([])

  useEffect(() => {
    setProcesses(recruitmentStore.getAll().filter(p => p.is_active))
    setContactCount(contactStore.getAll().length)
    setUpcomingDeadlines(deadlineStore.getUpcoming(14))
  }, [])

  const activeCount = processes.filter(p => !['Rejected', 'Withdrawn', 'Offer'].includes(p.stage)).length
  const offerCount = processes.filter(p => p.stage === 'Offer').length

  const followUpsNeeded = contactStore.getAll().filter(c => {
    if (!c.thank_you_sent) return true
    if (c.next_followup && new Date(c.next_followup) <= new Date()) return true
    return false
  }).length

  function toggleDeadline(id: string, completed: boolean) {
    deadlineStore.update(id, { completed })
    setUpcomingDeadlines(deadlineStore.getUpcoming(14))
  }

  return (
    <Shell>
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Good morning, Oded 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here is your recruiting snapshot for today.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          <StatCard
            icon={<Building2 size={18} className="text-blue-600" />}
            label="Active processes"
            value={activeCount}
            href="/recruitment"
            color="blue"
          />
          <StatCard
            icon={<Users size={18} className="text-purple-600" />}
            label="Network contacts"
            value={contactCount}
            href="/networking"
            color="purple"
          />
          <StatCard
            icon={<Mail size={18} className="text-orange-600" />}
            label="Follow-ups due"
            value={followUpsNeeded}
            href="/networking"
            color={followUpsNeeded > 0 ? 'orange' : 'gray'}
          />
        </div>

        {offerCount > 0 && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-800">You have {offerCount} offer{offerCount > 1 ? 's' : ''}!</p>
              <p className="text-sm text-green-600">Congratulations — view details in Recruiting.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Upcoming deadlines */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarClock size={16} className="text-blue-600" />
                Upcoming Deadlines
              </h2>
              <Link href="/calendar" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="px-5 pb-5">
              {upcomingDeadlines.length === 0 ? (
                <EmptyState text="No deadlines in the next 14 days" />
              ) : (
                <ul className="flex flex-col gap-2">
                  {upcomingDeadlines.slice(0, 5).map(d => {
                    const days = daysUntil(d.date)
                    return (
                      <li key={d.id} className="flex items-center gap-3 py-1.5">
                        <button onClick={() => toggleDeadline(d.id, !d.completed)} className="text-gray-400 hover:text-green-500 transition-colors flex-shrink-0">
                          {d.completed ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', d.completed && 'line-through text-gray-400')}>{d.title}</p>
                          <p className="text-xs text-gray-400">{formatDate(d.date)}</p>
                        </div>
                        {days !== null && !d.completed && (
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                            days <= 1 ? 'bg-red-100 text-red-700' :
                            days <= 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Active processes */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                Active Processes
              </h2>
              <Link href="/recruitment" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="px-5 pb-5">
              {processes.length === 0 ? (
                <EmptyState text="No active processes yet" cta="Add your first company →" href="/recruitment" />
              ) : (
                <ul className="flex flex-col gap-2">
                  {processes.slice(0, 5).map(p => (
                    <Link key={p.id} href={`/recruitment/${p.id}`} className="flex items-center gap-3 py-1.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                        {p.company_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.company_name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.role}</p>
                      </div>
                      <Badge className={STAGE_COLORS[p.stage]}>{p.stage}</Badge>
                    </Link>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      <QuickAddFAB />
    </Shell>
  )
}

function StatCard({
  icon, label, value, href, color
}: {
  icon: React.ReactNode; label: string; value: number; href: string; color: string
}) {
  const borders: Record<string, string> = {
    blue: 'border-blue-100', purple: 'border-purple-100',
    orange: 'border-orange-100', gray: 'border-gray-100'
  }
  return (
    <Link href={href} className={cn('bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow', borders[color] || 'border-gray-100')}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </Link>
  )
}

function EmptyState({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div className="text-center py-6 text-gray-400">
      <p className="text-sm">{text}</p>
      {cta && href && <Link href={href} className="text-xs text-blue-600 hover:underline mt-1 block">{cta}</Link>}
    </div>
  )
}
