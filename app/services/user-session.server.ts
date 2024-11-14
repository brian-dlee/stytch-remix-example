import { createCookieSessionStorage, SessionStorage } from "@remix-run/node";

export type SessionData = {
  stytchUserId: string
  userId: string
}

export type SessionFlashData = {
  message?: string
  messageType?: 'error' | 'warning' | 'info'
}

export type UserSessionStorage = SessionStorage<SessionData, SessionFlashData>

export const SESSION_DURATION_MINUTES = 43200; // 30 days
export const SESSION_DURATION_SECONDS = SESSION_DURATION_MINUTES * 60;

export function createUserSessionStorage(): UserSessionStorage {
  return createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",
      domain: undefined,
      httpOnly: true,
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
      sameSite: "lax",
      secrets: ["averysecretsecret1"],
      secure: true,
    }
  })
}

