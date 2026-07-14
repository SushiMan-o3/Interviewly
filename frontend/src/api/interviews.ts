import client from './client'
import type { Interview, InterviewCreate, InterviewSummary } from '../types'

export function getInterviews(skip = 0, limit = 6) {
  return client
    .get<InterviewSummary[]>('/interviews/interviews', { params: { skip, limit } })
    .then((res) => res.data)
}

export function getInterview(id: number) {
  return client.get<Interview>(`/interviews/${id}`).then((res) => res.data)
}

export function createInterview(payload: InterviewCreate) {
  return client
    .post<Interview>('/interviews/create_interview', payload)
    .then((res) => res.data)
}

export function deleteInterview(id: number) {
  return client.delete(`/interviews/${id}`)
}
