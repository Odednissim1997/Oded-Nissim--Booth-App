'use client'

import { RecruitmentProcess, Contact, CoffeeChat, Deadline } from '@/types'

const KEYS = {
  recruitment: 'booth_recruitment',
  contacts: 'booth_contacts',
  coffeeChats: 'booth_coffee_chats',
  deadlines: 'booth_deadlines',
}

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Recruitment ───────────────────────────────────────────────
export const recruitmentStore = {
  getAll(): RecruitmentProcess[] {
    return load<RecruitmentProcess>(KEYS.recruitment)
  },
  getById(id: string): RecruitmentProcess | undefined {
    return this.getAll().find(r => r.id === id)
  },
  create(data: Omit<RecruitmentProcess, 'id' | 'created_at' | 'updated_at'>): RecruitmentProcess {
    const record: RecruitmentProcess = { ...data, id: generateId(), created_at: now(), updated_at: now() }
    const all = this.getAll()
    save(KEYS.recruitment, [...all, record])
    return record
  },
  update(id: string, data: Partial<RecruitmentProcess>): RecruitmentProcess {
    const all = this.getAll()
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) throw new Error('Not found')
    all[idx] = { ...all[idx], ...data, updated_at: now() }
    save(KEYS.recruitment, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.recruitment, this.getAll().filter(r => r.id !== id))
  },
}

// ─── Contacts ──────────────────────────────────────────────────
export const contactStore = {
  getAll(): Contact[] {
    return load<Contact>(KEYS.contacts)
  },
  getById(id: string): Contact | undefined {
    return this.getAll().find(c => c.id === id)
  },
  create(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Contact {
    const record: Contact = { ...data, id: generateId(), created_at: now(), updated_at: now() }
    save(KEYS.contacts, [...this.getAll(), record])
    return record
  },
  update(id: string, data: Partial<Contact>): Contact {
    const all = this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Not found')
    all[idx] = { ...all[idx], ...data, updated_at: now() }
    save(KEYS.contacts, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.contacts, this.getAll().filter(c => c.id !== id))
  },
}

// ─── Coffee Chats ──────────────────────────────────────────────
export const coffeeChatStore = {
  getAll(): CoffeeChat[] {
    return load<CoffeeChat>(KEYS.coffeeChats)
  },
  getByContact(contactId: string): CoffeeChat[] {
    return this.getAll().filter(c => c.contact_id === contactId)
  },
  create(data: Omit<CoffeeChat, 'id' | 'created_at'>): CoffeeChat {
    const record: CoffeeChat = { ...data, id: generateId(), created_at: now() }
    save(KEYS.coffeeChats, [...this.getAll(), record])
    return record
  },
  update(id: string, data: Partial<CoffeeChat>): CoffeeChat {
    const all = this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Not found')
    all[idx] = { ...all[idx], ...data }
    save(KEYS.coffeeChats, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.coffeeChats, this.getAll().filter(c => c.id !== id))
  },
}

// ─── Deadlines ─────────────────────────────────────────────────
export const deadlineStore = {
  getAll(): Deadline[] {
    return load<Deadline>(KEYS.deadlines)
  },
  getUpcoming(days = 14): Deadline[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + days)
    return this.getAll()
      .filter(d => !d.completed && new Date(d.date) <= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },
  create(data: Omit<Deadline, 'id' | 'created_at'>): Deadline {
    const record: Deadline = { ...data, id: generateId(), created_at: now() }
    save(KEYS.deadlines, [...this.getAll(), record])
    return record
  },
  update(id: string, data: Partial<Deadline>): Deadline {
    const all = this.getAll()
    const idx = all.findIndex(d => d.id === id)
    if (idx === -1) throw new Error('Not found')
    all[idx] = { ...all[idx], ...data }
    save(KEYS.deadlines, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.deadlines, this.getAll().filter(d => d.id !== id))
  },
}
