import { supabase } from './supabase'

const CREDENTIAL_KEY = 'biometric_credential_id'
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'
const USER_EMAIL_KEY = 'saved_email'
const USER_ROLE_KEY = 'saved_role'
const REFRESH_TOKEN_KEY = 'biometric_refresh_token'

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=')
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
}

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
}

export function getSavedEmail(): string {
  return localStorage.getItem(USER_EMAIL_KEY) || ''
}

export function getSavedRole(): string {
  return localStorage.getItem(USER_ROLE_KEY) || 'client'
}

export function saveEmail(email: string) {
  localStorage.setItem(USER_EMAIL_KEY, email)
}

// Save refresh token (called after successful password login when biometric is enabled)
export function saveRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export async function registerBiometric(email: string): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const userId = new TextEncoder().encode(email)

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Align with Enjy', id: window.location.hostname },
        user: { id: userId, name: email, displayName: email },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null

    if (!credential) return false

    localStorage.setItem(CREDENTIAL_KEY, arrayBufferToBase64url(credential.rawId))
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true')
    localStorage.setItem(USER_EMAIL_KEY, email)

    // Save the current refresh token for later use
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
    }

    return true
  } catch (err) {
    console.error('Biometric register error:', err)
    return false
  }
}

// Verify biometric (just the fingerprint/face scan)
export async function verifyBiometric(): Promise<boolean> {
  try {
    const credentialId = localStorage.getItem(CREDENTIAL_KEY)
    if (!credentialId) return false

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{
          id: base64urlToUint8Array(credentialId),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    })

    return !!credential
  } catch (err) {
    console.error('Biometric verify error:', err)
    return false
  }
}

// Authenticate: verify biometric + restore Supabase session via refresh token
export async function authenticateWithBiometric(): Promise<boolean> {
  // Step 1: verify biometric
  const verified = await verifyBiometric()
  if (!verified) return false

  // Step 2: try existing session first
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    // Session still valid — refresh token rotation if needed
    if (session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
    }
    return true
  }

  // Step 3: session expired → use refresh token to get a new one
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      // Refresh token expired too — user must login with password
      return false
    }

    // Save the new refresh token (Supabase rotates them)
    if (data.session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token)
    }

    return true
  } catch (err) {
    console.error('Session refresh failed:', err)
    return false
  }
}

export function disableBiometric() {
  localStorage.removeItem(CREDENTIAL_KEY)
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
