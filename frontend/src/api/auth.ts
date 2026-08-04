import client from "./client";
import type { LoginPayload, RegisterPayload, Token } from "../types";

export async function register(payload: RegisterPayload): Promise<Token> {
  const { data } = await client.post<Token>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<Token> {
  const { data } = await client.post<Token>("/auth/login", payload);
  return data;
}

export async function forgetPassword(identifier: string): Promise<void> {
  await client.post("/auth/forget-password", { identifier });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await client.post("/auth/reset-password", { token, new_password: newPassword });
}
