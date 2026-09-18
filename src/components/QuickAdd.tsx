'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Input, Textarea } from './ui/Input'
import { Button } from './ui/Button'
import { contactStore } from '@/lib/store'
import { WarmthLevel } from '@/types'

export function QuickAddFAB() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [howWeMet, setHowWeMet] = useState('')
  const [notes, setNotes] = useState('')
  const [warmth, setWarmth] = useState<WarmthLevel>(2)

  function reset() {
    setName(''); setCompany(''); setTitle(''); setEmail(''); setHowWeMet(''); setNotes(''); setWarmth(2)
  }

  function handleSave() {
    if (!name.trim()) return
    contactStore.create({
      name: name.trim(),
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      email: email.trim() || undefined,
      how_we_met: howWeMet.trim() || undefined,
      notes: notes.trim() || undefined,
      met_date: new Date().toISOString().split('T')[0],
      warmth_level: warmth,
      tags: [],
      thank_you_sent: false,
    })
    reset()
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-4 pr-5 py-3 rounded-full shadow-lg transition-all hover:shadow-xl active:scale-95"
      >
        <Zap size={18} className="fill-current" />
        <span className="font-semibold text-sm">Quick Add</span>
      </button>

      <Modal open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }} title="Quick Add Contact">
        <p className="text-sm text-gray-500 -mt-3 mb-5">
          Capture the basics now — you can add full details later.
        </p>
        <div className="flex flex-col gap-4">
          <Input
            label="Name *"
            placeholder="e.g. Sarah Chen"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company"
              placeholder="McKinsey"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
            <Input
              label="Title"
              placeholder="Associate"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="sarah@mckinsey.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="How we met"
            placeholder="Alumni event, Booth info session..."
            value={howWeMet}
            onChange={e => setHowWeMet(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Connection warmth</label>
            <div className="flex gap-2">
              {([1, 2, 3] as WarmthLevel[]).map(w => (
                <button
                  key={w}
                  onClick={() => setWarmth(w)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    warmth === w
                      ? w === 1 ? 'bg-blue-100 border-blue-400 text-blue-700'
                        : w === 2 ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                        : 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {w === 1 ? '🔵 Cold' : w === 2 ? '🟡 Warm' : '🔴 Hot'}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Quick notes"
            placeholder="What you talked about, key insights..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setOpen(false); reset() }}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!name.trim()}>
              Save Contact
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
