'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { contactStore, coffeeChatStore, recruitmentStore } from '@/lib/store'
import { Contact, CoffeeChat, WarmthLevel } from '@/types'
import { WARMTH_COLORS, WARMTH_LABELS, formatDate, cn } from '@/lib/utils'
import { ArrowLeft, Edit2, Trash2, Plus, Coffee, CheckCircle2, Circle, ExternalLink, Mail, Phone } from 'lucide-react'

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [chats, setChats] = useState<CoffeeChat[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [editingChat, setEditingChat] = useState<CoffeeChat | null>(null)
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([])

  const [form, setForm] = useState<Partial<Contact>>({})
  const [chatForm, setChatForm] = useState({
    date: new Date().toISOString().split('T')[0],
    topics_discussed: '',
    insights: '',
    action_items: '',
    follow_up_date: '',
    notes: '',
  })

  useEffect(() => {
    const c = contactStore.getById(id)
    if (!c) { router.push('/networking'); return }
    setContact(c)
    setForm(c)
    setChats(coffeeChatStore.getByContact(id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    setCompanies([
      { value: '', label: 'None' },
      ...recruitmentStore.getAll().map(p => ({ value: p.id, label: p.company_name }))
    ])
  }, [id, router])

  function reload() {
    const c = contactStore.getById(id)
    if (!c) return
    setContact(c)
    setForm(c)
    setChats(coffeeChatStore.getByContact(id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  function handleSave() {
    contactStore.update(id, form)
    setEditOpen(false)
    reload()
  }

  function handleDelete() {
    if (!confirm(`Delete ${contact?.name}?`)) return
    contactStore.delete(id)
    router.push('/networking')
  }

  function toggleTY() {
    if (!contact) return
    contactStore.update(id, {
      thank_you_sent: !contact.thank_you_sent,
      thank_you_date: !contact.thank_you_sent ? new Date().toISOString().split('T')[0] : undefined
    })
    reload()
  }

  function handleSaveChat() {
    if (!chatForm.date) return
    if (editingChat) {
      coffeeChatStore.update(editingChat.id, chatForm)
    } else {
      coffeeChatStore.create({ contact_id: id, ...chatForm })
    }
    setChatForm({ date: new Date().toISOString().split('T')[0], topics_discussed: '', insights: '', action_items: '', follow_up_date: '', notes: '' })
    setEditingChat(null)
    setChatOpen(false)
    reload()
  }

  function openEditChat(chat: CoffeeChat) {
    setEditingChat(chat)
    setChatForm({
      date: chat.date,
      topics_discussed: chat.topics_discussed || '',
      insights: chat.insights || '',
      action_items: chat.action_items || '',
      follow_up_date: chat.follow_up_date || '',
      notes: chat.notes || '',
    })
    setChatOpen(true)
  }

  function deleteChat(chatId: string) {
    if (!confirm('Delete this coffee chat?')) return
    coffeeChatStore.delete(chatId)
    reload()
  }

  if (!contact) return null

  const linkedCompany = contact.company_id ? recruitmentStore.getById(contact.company_id) : null

  return (
    <Shell>
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <Link href="/networking" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
          <ArrowLeft size={15} /> Back to Network
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600">
              {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
              <p className="text-gray-500 text-sm">{[contact.title, contact.company].filter(Boolean).join(' · ')}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={WARMTH_COLORS[contact.warmth_level]}>{WARMTH_LABELS[contact.warmth_level]}</Badge>
                {contact.thank_you_sent ? (
                  <Badge className="bg-green-50 text-green-700 flex items-center gap-1">
                    <CheckCircle2 size={11} /> TY Sent {contact.thank_you_date ? `· ${formatDate(contact.thank_you_date)}` : ''}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-50 text-yellow-700">Thank You Pending</Badge>
                )}
                {linkedCompany && (
                  <Link href={`/recruitment/${linkedCompany.id}`}>
                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100">{linkedCompany.company_name}</Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Edit2 size={14} /> Edit</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={14} /></Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Contact info + TY tracker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Contact Info</h2>
            <div className="flex flex-col gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail size={14} /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Phone size={14} /> {contact.phone}
                </a>
              )}
              {contact.linkedin_url && (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink size={14} /> LinkedIn
                </a>
              )}
              {contact.how_we_met && (
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-1">How we met</p>
                  <p className="text-sm text-gray-700">{contact.how_we_met}</p>
                </div>
              )}
              {contact.met_date && (
                <p className="text-xs text-gray-400">Met on {formatDate(contact.met_date)}</p>
              )}
            </div>

            {/* Thank You Note */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Thank You Note</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {contact.thank_you_sent
                      ? `Sent ${contact.thank_you_date ? formatDate(contact.thank_you_date) : ''}`
                      : 'Not sent yet'}
                  </p>
                </div>
                <button
                  onClick={toggleTY}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    contact.thank_you_sent
                      ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                  )}
                >
                  {contact.thank_you_sent ? <><CheckCircle2 size={13} /> Sent</> : <><Circle size={13} /> Mark Sent</>}
                </button>
              </div>
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}

            {contact.tags.length > 0 && (
              <div className="mt-3 flex gap-1 flex-wrap">
                {contact.tags.map(t => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Coffee Chats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                <Coffee size={13} /> Coffee Chats ({chats.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setEditingChat(null); setChatOpen(true) }}>
                <Plus size={14} /> Log Chat
              </Button>
            </div>

            {chats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No coffee chats logged yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {chats.map(chat => (
                  <div key={chat.id} className="border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500">{formatDate(chat.date)}</p>
                      <div className="flex gap-1">
                        <button onClick={() => openEditChat(chat)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => deleteChat(chat.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {chat.topics_discussed && <ChatField label="Topics" value={chat.topics_discussed} />}
                    {chat.insights && <ChatField label="Insights" value={chat.insights} />}
                    {chat.action_items && <ChatField label="Action Items" value={chat.action_items} highlight />}
                    {chat.follow_up_date && (
                      <p className="text-xs text-blue-600 mt-2">Follow up: {formatDate(chat.follow_up_date)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit contact modal */}
      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Contact" size="lg">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company" value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <Input label="Title" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <Input label="LinkedIn URL" value={form.linkedin_url || ''} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="How we met" value={form.how_we_met || ''} onChange={e => setForm(f => ({ ...f, how_we_met: e.target.value }))} />
            <Input label="Met Date" type="date" value={form.met_date || ''} onChange={e => setForm(f => ({ ...f, met_date: e.target.value }))} />
          </div>
          <Select label="Link to Recruiting Process" value={form.company_id || ''} onChange={e => setForm(f => ({ ...f, company_id: e.target.value || undefined }))} options={companies} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Warmth</label>
            <div className="flex gap-2">
              {([1, 2, 3] as WarmthLevel[]).map(w => (
                <button key={w} onClick={() => setForm(f => ({ ...f, warmth_level: w }))}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                    form.warmth_level === w
                      ? w === 1 ? 'bg-blue-100 border-blue-400 text-blue-700'
                        : w === 2 ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                        : 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  )}>
                  {w === 1 ? '🔵 Cold' : w === 2 ? '🟡 Warm' : '🔴 Hot'}
                </button>
              ))}
            </div>
          </div>
          <Input label="Next Follow-up Date" type="date" value={form.next_followup || ''} onChange={e => setForm(f => ({ ...f, next_followup: e.target.value }))} />
          <Textarea label="Notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Coffee chat modal */}
      <Modal open={chatOpen} onOpenChange={(o) => { setChatOpen(o); if (!o) setEditingChat(null) }} title={editingChat ? 'Edit Coffee Chat' : 'Log Coffee Chat'} size="lg">
        <div className="flex flex-col gap-4">
          <Input label="Date" type="date" value={chatForm.date} onChange={e => setChatForm(f => ({ ...f, date: e.target.value }))} />
          <Textarea label="Topics Discussed" placeholder="Firm culture, career path, project examples..." value={chatForm.topics_discussed} onChange={e => setChatForm(f => ({ ...f, topics_discussed: e.target.value }))} />
          <Textarea label="Key Insights" placeholder="What you learned about the firm, role, or industry..." value={chatForm.insights} onChange={e => setChatForm(f => ({ ...f, insights: e.target.value }))} />
          <Textarea label="Action Items" placeholder="Send resume, follow up on referral, research X..." value={chatForm.action_items} onChange={e => setChatForm(f => ({ ...f, action_items: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Follow-up Date" type="date" value={chatForm.follow_up_date} onChange={e => setChatForm(f => ({ ...f, follow_up_date: e.target.value }))} />
          </div>
          <Textarea label="Other Notes" placeholder="Anything else worth remembering..." value={chatForm.notes} onChange={e => setChatForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setChatOpen(false); setEditingChat(null) }}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveChat} disabled={!chatForm.date}>Save</Button>
          </div>
        </div>
      </Modal>
    </Shell>
  )
}

function ChatField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="mt-2">
      <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-0.5', highlight ? 'text-blue-500' : 'text-gray-400')}>{label}</p>
      <p className="text-xs text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  )
}
