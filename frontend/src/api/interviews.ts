import client from "./client";
import type { CreateInterviewPayload, Interview, InterviewSummary } from "../types";

export async function getInterviews(skip = 0, limit = 6): Promise<InterviewSummary[]> {
  const { data } = await client.get<InterviewSummary[]>("/interviews/interviews", {
    params: { skip, limit },
  });
  return data;
}

export async function getInterview(id: number): Promise<Interview> {
  const { data } = await client.get<Interview>(`/interviews/${id}`);
  return data;
}

export async function createInterview(payload: CreateInterviewPayload): Promise<Interview> {
  const formData = new FormData();
  formData.append("company", payload.company);
  formData.append("role", payload.role);
  formData.append("interview_type", payload.interview_type);
  formData.append("difficulty", payload.difficulty);
  formData.append("planned_duration", String(payload.planned_duration));
  if (payload.resume) {
    formData.append("resume", payload.resume);
  }

  const { data } = await client.post<Interview>("/interviews/create_interview", formData);
  return data;
}

export async function deleteInterview(id: number): Promise<void> {
  await client.delete(`/interviews/${id}`);
}
