'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { QuickAddFAB } from '@/components/QuickAdd'
import { Badge } from '@/components/ui/Badge'
import { contactStore } from '@/lib/store'
import { Contact } from '@/types'
import { WARMTH_COLORS, WARMTH_LABELS, cn } from '@/lib/utils'
import { Search, Mail, ChevronRight, SlidersHorizontal } from 'lucide-react'

type SortKey = 'name' | 'met_date' | 'warmth' | 'company'
type Filter = 'all' | 'no-ty' | 'followup' | 'warm' | 'hot'

export default function NetworkingPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('met_date')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => { setContacts(contactStore.getAll()) }, [])

  const filtered = contacts
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))

      const matchFilter =
        filter === 'all' ? true :
        filter === 'no-ty' ? !c.thank_you_sent :
        filter === 'followup' ? (c.next_followup ? new Date(c.next_followup) <= new Date() : false) :
        filter === 'warm' ? c.warmth_level === 2 :
        filter === 'hot' ? c.warmth_level === 3 : true

      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'met_date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'warmth') return b.warmth_level - a.warmth_level
      if (sort === 'company') return (a.company || '').localeCompare(b.company || '')
      return 0
    })

  const noTyCount = contacts.filter(c => !c.thank_you_sent).length

  return (
    <Shell>
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network</h1>
            <p className="text-sm text-gray-500">{contacts.length} contacts</p>
          </div>
          {noTyCount > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Mail size={13} />
              {noTyCount} thank you note{noTyCount > 1 ? 's' : ''} pending
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {([
            ['all', 'All'],
            ['no-ty', 'No TY Note'],
            ['followup', 'Follow-up Due'],
            ['hot', '🔴 Hot'],
            ['warm', '🟡 Warm'],
          ] as [Filter, string][]).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search & sort */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Search by name, company, tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 text-gray-500">
            <SlidersHorizontal size={14} />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="text-sm bg-transparent border-none focus:outline-none py-2 cursor-pointer"
            >
              <option value="met_date">Recent</option>
              <option value="name">Name</option>
              <option value="warmth">Warmth</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>

        {/* Contact list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UsersIcon />
            <p className="font-medium mt-3">No contacts yet</p>
            <p className="text-sm mt-1">Use the Quick Add button to capture someone during a meeting</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {filtered.map(c => (
                <li key={c.id}>
                  <Link href={`/networking/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0 text-sm">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                        {!c.thank_you_sent && (
                          <span className="flex-shrink-0 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">TY pending</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {[c.title, c.company].filter(Boolean).join(' · ')}
                      </p>
                      {c.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {c.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge className={WARMTH_COLORS[c.warmth_level]}>{WARMTH_LABELS[c.warmth_level]}</Badge>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <QuickAddFAB />
    </Shell>
  )
}

function UsersIcon() {
  return (
    <svg className="mx-auto w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
