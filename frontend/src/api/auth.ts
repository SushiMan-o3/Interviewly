import client from './client'

export interface Token {
  access_token: string
  token_type: string
}

export function register(name: string, username: string, password: string) {
  return client
    .post<Token>('/auth/register', { name, username, password })
    .then((res) => res.data)
}

export function login(username: string, password: string) {
  return client
    .post<Token>('/auth/login', { username, password })
    .then((res) => res.data)
}
