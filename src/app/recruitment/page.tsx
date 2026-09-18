'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { QuickAddFAB } from '@/components/QuickAdd'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { recruitmentStore, deadlineStore } from '@/lib/store'
import { RecruitmentProcess, RecruitmentStage } from '@/types'
import { STAGE_COLORS, STAGE_ORDER, daysUntil, cn } from '@/lib/utils'
import { Plus, Search, ChevronRight, CalendarClock } from 'lucide-react'

const STAGE_OPTIONS = STAGE_ORDER.map(s => ({ value: s, label: s }))
const FILTER_OPTIONS = [{ value: 'all', label: 'All Stages' }, ...STAGE_OPTIONS]

export default function RecruitmentPage() {
  const [processes, setProcesses] = useState<RecruitmentProcess[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)

  // form state
  const [form, setForm] = useState({
    company_name: '', role: '', office: '', stage: 'Applied' as RecruitmentStage,
    applied_date: '', next_deadline: '', recruiter_name: '', recruiter_email: '', notes: ''
  })

  useEffect(() => { setProcesses(recruitmentStore.getAll()) }, [])

  function reload() { setProcesses(recruitmentStore.getAll()) }

  function handleAdd() {
    if (!form.company_name.trim()) return
    const p = recruitmentStore.create({
      company_name: form.company_name.trim(),
      role: form.role.trim() || 'Consultant',
      office: form.office.trim() || undefined,
      stage: form.stage,
      applied_date: form.applied_date || undefined,
      next_deadline: form.next_deadline || undefined,
      recruiter_name: form.recruiter_name.trim() || undefined,
      recruiter_email: form.recruiter_email.trim() || undefined,
      notes: form.notes.trim() || undefined,
      is_active: true,
    })
    // auto-create deadline if provided
    if (form.next_deadline) {
      deadlineStore.create({
        company_id: p.id,
        title: `${form.company_name} — deadline`,
        date: form.next_deadline,
        type: 'Application',
        completed: false,
      })
    }
    setForm({ company_name: '', role: '', office: '', stage: 'Applied', applied_date: '', next_deadline: '', recruiter_name: '', recruiter_email: '', notes: '' })
    setAddOpen(false)
    reload()
  }

  const filtered = processes.filter(p => {
    const matchSearch = p.company_name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'all' || p.stage === stageFilter
    return matchSearch && matchStage
  })

  const grouped = STAGE_ORDER.reduce<Record<string, RecruitmentProcess[]>>((acc, stage) => {
    const items = filtered.filter(p => p.stage === stage)
    if (items.length) acc[stage] = items
    return acc
  }, {})

  return (
    <Shell>
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruiting</h1>
            <p className="text-sm text-gray-500">{processes.length} companies tracked</p>
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus size={15} /> Add Company
          </Button>
        </div>

        {/* Search & filter */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Search companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500"
          >
            {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Pipeline view */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2Size />
            <p className="font-medium mt-3">No companies yet</p>
            <p className="text-sm mt-1">Add your first company to get started</p>
            <Button onClick={() => setAddOpen(true)} className="mt-4">
              <Plus size={15} /> Add Company
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([stage, items]) => (
              <div key={stage} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                  <Badge className={STAGE_COLORS[stage as RecruitmentStage]}>{stage}</Badge>
                  <span className="text-xs text-gray-400">{items.length} compan{items.length === 1 ? 'y' : 'ies'}</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {items.map(p => {
                    const days = daysUntil(p.next_deadline)
                    return (
                      <li key={p.id}>
                        <Link href={`/recruitment/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                            {p.company_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{p.company_name}</p>
                            <p className="text-xs text-gray-400 truncate">{p.role}{p.office ? ` · ${p.office}` : ''}</p>
                          </div>
                          {p.next_deadline && days !== null && (
                            <div className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg flex-shrink-0',
                              days <= 1 ? 'bg-red-50 text-red-600' :
                              days <= 3 ? 'bg-orange-50 text-orange-600' :
                              'bg-gray-50 text-gray-500'
                            )}>
                              <CalendarClock size={11} />
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                            </div>
                          )}
                          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add company modal */}
      <Modal open={addOpen} onOpenChange={setAddOpen} title="Add Company" size="lg">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company Name *" placeholder="McKinsey & Company" value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
            <Input label="Role" placeholder="Consultant" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Office" placeholder="Chicago, New York..." value={form.office}
              onChange={e => setForm(f => ({ ...f, office: e.target.value }))} />
            <Select label="Stage" value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value as RecruitmentStage }))}
              options={STAGE_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Applied Date" type="date" value={form.applied_date}
              onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} />
            <Input label="Next Deadline" type="date" value={form.next_deadline}
              onChange={e => setForm(f => ({ ...f, next_deadline: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Recruiter Name" placeholder="Jane Smith" value={form.recruiter_name}
              onChange={e => setForm(f => ({ ...f, recruiter_name: e.target.value }))} />
            <Input label="Recruiter Email" type="email" placeholder="j.smith@firm.com" value={form.recruiter_email}
              onChange={e => setForm(f => ({ ...f, recruiter_email: e.target.value }))} />
          </div>
          <Textarea label="Notes" placeholder="Research, talking points, referrals..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAdd} disabled={!form.company_name.trim()}>Add Company</Button>
          </div>
        </div>
      </Modal>

      <QuickAddFAB />
    </Shell>
  )
}

function Building2Size() {
  return (
    <svg className="mx-auto w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
