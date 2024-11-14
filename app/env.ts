export type Env = {
  stytchProjectId: string
  stytchSecret: string
  stytchEnv: string
}

export function readEnv(): Env {
  const { STYTCH_PROJECT_ID, STYTCH_SECRET, STYTCH_ENV } = process.env

  let stytchProjectId = ""
  if (!STYTCH_PROJECT_ID) {
    console.error('STYTCH_PROJECT_ID is not defined')
  } else {
    stytchProjectId = STYTCH_PROJECT_ID
  }

  let stytchSecret = ""
  if (!STYTCH_SECRET) {
    console.error('STYTCH_SECRET is not defined')
  } else {
    stytchSecret = STYTCH_SECRET
  }

  let stytchEnv = ""
  if (!STYTCH_ENV) {
    console.error('STYTCH_ENV is not defined')
  } else {
    stytchEnv = STYTCH_ENV
  }

  if (!stytchProjectId || !stytchSecret) {
    throw new Error("One or more required environment variables are not defined")
  }

  return {
    stytchProjectId,
    stytchSecret,
    stytchEnv: stytchEnv || "test",
  }
}
