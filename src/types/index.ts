export type RecruitmentStage =
  | 'Applied'
  | 'Phone Screen'
  | 'First Round'
  | 'Second Round'
  | 'Final Round'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn'

export type WarmthLevel = 1 | 2 | 3 // 1=Cold, 2=Warm, 3=Hot

export interface RecruitmentProcess {
  id: string
  company_name: string
  role: string
  office?: string
  stage: RecruitmentStage
  applied_date?: string
  next_deadline?: string
  recruiter_name?: string
  recruiter_email?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  linkedin_url?: string
  company?: string
  title?: string
  how_we_met?: string
  met_date?: string
  tags: string[]
  notes?: string
  warmth_level: WarmthLevel
  company_id?: string // link to recruitment process
  thank_you_sent: boolean
  thank_you_date?: string
  next_followup?: string
  created_at: string
  updated_at: string
}

export interface CoffeeChat {
  id: string
  contact_id: string
  date: string
  topics_discussed?: string
  insights?: string
  action_items?: string
  follow_up_date?: string
  notes?: string
  created_at: string
}

export interface Deadline {
  id: string
  company_id?: string
  contact_id?: string
  title: string
  date: string
  type: 'Application' | 'Interview' | 'Decision' | 'Follow-up' | 'Other'
  completed: boolean
  notes?: string
  created_at: string
}
