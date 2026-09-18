'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { recruitmentStore, contactStore, deadlineStore } from '@/lib/store'
import { RecruitmentProcess, Contact, Deadline, RecruitmentStage } from '@/types'
import { STAGE_COLORS, STAGE_ORDER, WARMTH_COLORS, WARMTH_LABELS, formatDate, daysUntil, cn } from '@/lib/utils'
import { ArrowLeft, Edit2, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react'

const STAGE_OPTIONS = STAGE_ORDER.map(s => ({ value: s, label: s }))

export default function RecruitmentDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [process, setProcess] = useState<RecruitmentProcess | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [form, setForm] = useState<Partial<RecruitmentProcess>>({})
  const [dlForm, setDlForm] = useState({ title: '', date: '', type: 'Interview' as Deadline['type'], notes: '' })

  useEffect(() => {
    const p = recruitmentStore.getById(id)
    if (!p) { router.push('/recruitment'); return }
    setProcess(p)
    setForm(p)
    setContacts(contactStore.getAll().filter(c => c.company_id === id))
    setDeadlines(deadlineStore.getAll().filter(d => d.company_id === id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  }, [id, router])

  function reload() {
    const p = recruitmentStore.getById(id)
    if (!p) return
    setProcess(p)
    setContacts(contactStore.getAll().filter(c => c.company_id === id))
    setDeadlines(deadlineStore.getAll().filter(d => d.company_id === id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  }

  function handleSave() {
    if (!form.company_name?.trim()) return
    recruitmentStore.update(id, form)
    setEditOpen(false)
    reload()
  }

  function handleDelete() {
    if (!confirm(`Delete ${process?.company_name}? This cannot be undone.`)) return
    recruitmentStore.delete(id)
    router.push('/recruitment')
  }

  function handleAddDeadline() {
    if (!dlForm.title.trim() || !dlForm.date) return
    deadlineStore.create({ company_id: id, title: dlForm.title.trim(), date: dlForm.date, type: dlForm.type, completed: false, notes: dlForm.notes.trim() || undefined })
    setDlForm({ title: '', date: '', type: 'Interview', notes: '' })
    setDeadlineOpen(false)
    reload()
  }

  function toggleDeadline(did: string, completed: boolean) {
    deadlineStore.update(did, { completed })
    reload()
  }

  if (!process) return null

  const isActive = !['Rejected', 'Withdrawn'].includes(process.stage)

  return (
    <Shell>
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/recruitment" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
          <ArrowLeft size={15} /> Back to Recruiting
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl font-bold text-blue-700">
              {process.company_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{process.company_name}</h1>
              <p className="text-gray-500 text-sm">{process.role}{process.office ? ` · ${process.office}` : ''}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={STAGE_COLORS[process.stage]}>{process.stage}</Badge>
                {!isActive && <Badge className="bg-gray-100 text-gray-500">Closed</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Pipeline Progress</p>
            <div className="flex items-center gap-1">
              {STAGE_ORDER.filter(s => !['Rejected', 'Withdrawn'].includes(s)).map((stage, i) => {
                const activeIdx = STAGE_ORDER.filter(s => !['Rejected', 'Withdrawn'].includes(s)).indexOf(process.stage)
                const passed = i <= activeIdx
                return (
                  <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                    <div className={cn('h-2 w-full rounded-full transition-all', passed ? 'bg-blue-600' : 'bg-gray-100')} />
                    <span className={cn('text-[9px] text-center hidden sm:block leading-tight', passed ? 'text-blue-600 font-medium' : 'text-gray-400')}>
                      {stage.replace('Round', 'R.')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Key details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide text-gray-400">Details</h2>
            <dl className="flex flex-col gap-3">
              <Row label="Applied" value={formatDate(process.applied_date)} />
              <Row label="Next Deadline" value={process.next_deadline ? (
                <span className={cn('font-medium', (daysUntil(process.next_deadline) ?? 99) <= 3 ? 'text-red-600' : '')}>
                  {formatDate(process.next_deadline)}
                  {daysUntil(process.next_deadline) !== null && <span className="text-xs ml-2 text-gray-400">({daysUntil(process.next_deadline)}d)</span>}
                </span>
              ) : '—'} />
              {process.recruiter_name && <Row label="Recruiter" value={process.recruiter_name} />}
              {process.recruiter_email && (
                <Row label="Email" value={
                  <a href={`mailto:${process.recruiter_email}`} className="text-blue-600 hover:underline">{process.recruiter_email}</a>
                } />
              )}
            </dl>
            {process.notes && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{process.notes}</p>
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide text-gray-400">Deadlines</h2>
              <Button variant="ghost" size="sm" onClick={() => setDeadlineOpen(true)}>
                <Plus size={14} /> Add
              </Button>
            </div>
            {deadlines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No deadlines yet</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {deadlines.map(d => {
                  const days = daysUntil(d.date)
                  return (
                    <li key={d.id} className="flex items-center gap-2">
                      <button onClick={() => toggleDeadline(d.id, !d.completed)} className="text-gray-300 hover:text-green-500 transition-colors">
                        {d.completed ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
                      </button>
                      <div className="flex-1">
                        <p className={cn('text-sm', d.completed && 'line-through text-gray-400')}>{d.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(d.date)} · {d.type}</p>
                      </div>
                      {days !== null && !d.completed && (
                        <span className={cn('text-xs px-1.5 py-0.5 rounded',
                          days <= 1 ? 'bg-red-100 text-red-600' : days <= 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                        )}>
                          {days === 0 ? 'Today' : `${days}d`}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Contacts at this company */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide text-gray-400">
                Contacts at {process.company_name}
              </h2>
            </div>
            {contacts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No linked contacts yet — add a contact from the Network tab and link it to this company.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {contacts.map(c => (
                  <li key={c.id}>
                    <Link href={`/networking/${c.id}`} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.title}</p>
                      </div>
                      <Badge className={cn(WARMTH_COLORS[c.warmth_level])}>{WARMTH_LABELS[c.warmth_level]}</Badge>
                      {!c.thank_you_sent && (
                        <Badge className="bg-yellow-50 text-yellow-700">No TY</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Company" size="lg">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company Name" value={form.company_name || ''} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
            <Input label="Role" value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Office" value={form.office || ''} onChange={e => setForm(f => ({ ...f, office: e.target.value }))} />
            <Select label="Stage" value={form.stage || 'Applied'} onChange={e => setForm(f => ({ ...f, stage: e.target.value as RecruitmentStage }))} options={STAGE_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Applied Date" type="date" value={form.applied_date || ''} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} />
            <Input label="Next Deadline" type="date" value={form.next_deadline || ''} onChange={e => setForm(f => ({ ...f, next_deadline: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Recruiter Name" value={form.recruiter_name || ''} onChange={e => setForm(f => ({ ...f, recruiter_name: e.target.value }))} />
            <Input label="Recruiter Email" type="email" value={form.recruiter_email || ''} onChange={e => setForm(f => ({ ...f, recruiter_email: e.target.value }))} />
          </div>
          <Textarea label="Notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add deadline modal */}
      <Modal open={deadlineOpen} onOpenChange={setDeadlineOpen} title="Add Deadline">
        <div className="flex flex-col gap-4">
          <Input label="Title" placeholder="First round interview" value={dlForm.title} onChange={e => setDlForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={dlForm.date} onChange={e => setDlForm(f => ({ ...f, date: e.target.value }))} />
            <Select label="Type" value={dlForm.type} onChange={e => setDlForm(f => ({ ...f, type: e.target.value as Deadline['type'] }))}
              options={[
                { value: 'Application', label: 'Application' },
                { value: 'Interview', label: 'Interview' },
                { value: 'Decision', label: 'Decision' },
                { value: 'Follow-up', label: 'Follow-up' },
                { value: 'Other', label: 'Other' },
              ]} />
          </div>
          <Textarea label="Notes" placeholder="Details about this deadline..." value={dlForm.notes} onChange={e => setDlForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeadlineOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddDeadline} disabled={!dlForm.title.trim() || !dlForm.date}>Add Deadline</Button>
          </div>
        </div>
      </Modal>
    </Shell>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 flex-1">{value || '—'}</dd>
    </div>
  )
}
