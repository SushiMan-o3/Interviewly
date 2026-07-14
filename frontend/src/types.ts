export interface Token {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface QuestionResponse {
  id: number;
  question_id: number;
  transcript_text: string | null;
  response_time_seconds: number | null;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

export interface Question {
  id: number;
  interview_id: number;
  sequence_number: number;
  question_text: string;
  question_type: string | null;
  parent_question_id: number | null;
  asked_at: string | null;
  responses: QuestionResponse[];
}

export interface InterviewSummary {
  id: number;
  user_id: number;
  created_at: string;
  completed: boolean;
  planned_duration: number;
  interview_type: string;
  difficulty: string;
  role: string;
  company: string;
}

export interface Interview extends InterviewSummary {
  start_time: string | null;
  end_time: string | null;
  overall_score: number | null;
  feedback: string | null;
  QuestionAnswer: Question[];
}

export interface CreateInterviewPayload {
  company: string;
  role: string;
  interview_type: string;
  difficulty: string;
  planned_duration: number;
  resume: File | null;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  created_at: string;
}

export interface UpdateProfilePayload {
  name: string;
  username: string;
  email: string;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface AdditionalUserInfo {
  target_role: string | null;
  experience: string | null;
  industry: string | null;
  has_resume: boolean;
}

export interface AdditionalUserInfoPayload {
  target_role: string;
  experience: string;
  industry: string;
  resume: File | null;
}
