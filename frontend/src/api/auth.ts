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
