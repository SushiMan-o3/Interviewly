export interface User {
  id: number
  name: string
  username: string
  created_at: string
}

export interface Response {
  id: number
  question_id: number
  transcript_text?: string | null
  response_time_seconds?: number | null
  score?: number | null
  feedback?: string | null
  created_at: string
}

export interface Question {
  id: number
  interview_id: number
  sequence_number: number
  question_text: string
  question_type?: string | null
  parent_question_id?: number | null
  asked_at?: string | null
  responses: Response[]
}

export interface Interview {
  id: number
  user_id: number
  company: string
  role: string
  interview_type: string
  difficulty: string
  planned_duration: number
  start_time?: string | null
  end_time?: string | null
  overall_score?: number | null
  feedback?: string | null
  completed: boolean
  created_at: string
  questions: Question[]
}

export interface InterviewSummary {
  id: number
  user_id: number
  created_at: string
  completed: boolean
  planned_duration: number
  interview_type: string
  difficulty: string
  role: string
  company: string
}

export interface InterviewCreate {
  company: string
  role: string
  interview_type: string
  difficulty: string
  planned_duration: number
}
