import client from "./client";
import type {
  AdditionalUserInfo,
  AdditionalUserInfoPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from "../types";

export async function getProfile(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>("/settings/profile");
  return data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await client.put<UserProfile>("/settings/profile", payload);
  return data;
}

export async function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  await client.put("/settings/password", payload);
}

export async function getAdditionalInfo(): Promise<AdditionalUserInfo> {
  const { data } = await client.get<AdditionalUserInfo>("/settings/additional-info");
  return data;
}

export async function updateAdditionalInfo(payload: AdditionalUserInfoPayload): Promise<AdditionalUserInfo> {
  const formData = new FormData();
  formData.append("target_role", payload.target_role);
  formData.append("experience", payload.experience);
  formData.append("industry", payload.industry);
  if (payload.resume) {
    formData.append("resume", payload.resume);
  }

  const { data } = await client.put<AdditionalUserInfo>("/settings/additional-info", formData);
  return data;
}

export async function deleteAccount(): Promise<void> {
  await client.delete("/settings/account");
}
