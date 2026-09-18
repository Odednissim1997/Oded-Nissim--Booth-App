'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { QuickAddFAB } from '@/components/QuickAdd'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { deadlineStore, recruitmentStore } from '@/lib/store'
import { Deadline } from '@/types'
import { formatDate, daysUntil, cn } from '@/lib/utils'
import { Plus, CheckCircle2, Circle, Trash2, CalendarDays } from 'lucide-react'

type Tab = 'upcoming' | 'completed' | 'all'

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [tab, setTab] = useState<Tab>('upcoming')
  const [addOpen, setAddOpen] = useState(false)
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([])
  const [form, setForm] = useState({
    title: '', date: '', type: 'Interview' as Deadline['type'],
    company_id: '', notes: ''
  })

  useEffect(() => {
    reload()
    setCompanies([
      { value: '', label: 'No company' },
      ...recruitmentStore.getAll().map(p => ({ value: p.id, label: p.company_name }))
    ])
  }, [])

  function reload() {
    const all = deadlineStore.getAll().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setDeadlines(all)
  }

  function toggle(id: string, completed: boolean) {
    deadlineStore.update(id, { completed })
    reload()
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this deadline?')) return
    deadlineStore.delete(id)
    reload()
  }

  function handleAdd() {
    if (!form.title.trim() || !form.date) return
    deadlineStore.create({
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      company_id: form.company_id || undefined,
      completed: false,
      notes: form.notes.trim() || undefined,
    })
    setForm({ title: '', date: '', type: 'Interview', company_id: '', notes: '' })
    setAddOpen(false)
    reload()
  }

  const filtered = deadlines.filter(d => {
    if (tab === 'upcoming') return !d.completed
    if (tab === 'completed') return d.completed
    return true
  })

  // Group by month
  const grouped = filtered.reduce<Record<string, Deadline[]>>((acc, d) => {
    const month = new Date(d.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(d)
    return acc
  }, {})

  const TYPE_COLORS: Record<string, string> = {
    Application: 'bg-blue-100 text-blue-700',
    Interview: 'bg-purple-100 text-purple-700',
    Decision: 'bg-red-100 text-red-700',
    'Follow-up': 'bg-yellow-100 text-yellow-700',
    Other: 'bg-gray-100 text-gray-600',
  }

  const companyMap = Object.fromEntries(recruitmentStore.getAll().map(p => [p.id, p.company_name]))

  return (
    <Shell>
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500">{deadlines.filter(d => !d.completed).length} upcoming deadlines</p>
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus size={15} /> Add Deadline
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {(['upcoming', 'completed', 'all'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}>
              {t}
            </button>
          ))}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="mx-auto w-12 h-12 text-gray-200 mb-3" />
            <p className="font-medium">No deadlines yet</p>
            <p className="text-sm mt-1">Add deadlines from here or from a company page</p>
            <Button onClick={() => setAddOpen(true)} className="mt-4"><Plus size={15} /> Add Deadline</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{month}</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <ul className="divide-y divide-gray-50">
                    {items.map(d => {
                      const days = daysUntil(d.date)
                      return (
                        <li key={d.id} className="flex items-center gap-4 px-5 py-4">
                          <button onClick={() => toggle(d.id, !d.completed)} className="text-gray-300 hover:text-green-500 transition-colors flex-shrink-0">
                            {d.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium', d.completed && 'line-through text-gray-400')}>
                              {d.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400">{formatDate(d.date)}</span>
                              {d.company_id && companyMap[d.company_id] && (
                                <span className="text-xs text-blue-500">{companyMap[d.company_id]}</span>
                              )}
                            </div>
                            {d.notes && <p className="text-xs text-gray-400 mt-1">{d.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', TYPE_COLORS[d.type] || 'bg-gray-100 text-gray-600')}>
                              {d.type}
                            </span>
                            {days !== null && !d.completed && (
                              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                                days < 0 ? 'bg-red-100 text-red-700' :
                                days === 0 ? 'bg-red-100 text-red-700' :
                                days <= 3 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              )}>
                                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                              </span>
                            )}
                            <button onClick={() => handleDelete(d.id)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={addOpen} onOpenChange={setAddOpen} title="Add Deadline">
        <div className="flex flex-col gap-4">
          <Input label="Title *" placeholder="First round interview at McKinsey" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Deadline['type'] }))}
              options={[
                { value: 'Application', label: 'Application' },
                { value: 'Interview', label: 'Interview' },
                { value: 'Decision', label: 'Decision' },
                { value: 'Follow-up', label: 'Follow-up' },
                { value: 'Other', label: 'Other' },
              ]} />
          </div>
          <Select label="Company (optional)" value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} options={companies} />
          <Textarea label="Notes" placeholder="Additional context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAdd} disabled={!form.title.trim() || !form.date}>Add Deadline</Button>
          </div>
        </div>
      </Modal>

      <QuickAddFAB />
    </Shell>
  )
}
