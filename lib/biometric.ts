const CREDENTIAL_KEY = 'biometric_credential_id'
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'
const USER_EMAIL_KEY = 'saved_email'
const USER_ROLE_KEY = 'saved_role'

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

export function saveUserInfo(email: string, role: string) {
  localStorage.setItem(USER_EMAIL_KEY, email)
  localStorage.setItem(USER_ROLE_KEY, role)
}

// Keep for backwards compatibility
export function saveEmail(email: string) {
  localStorage.setItem(USER_EMAIL_KEY, email)
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
    return true
  } catch (err) {
    console.error('Biometric register error:', err)
    return false
  }
}

export async function authenticateWithBiometric(): Promise<boolean> {
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
    console.error('Biometric auth error:', err)
    return false
  }
}

export function disableBiometric() {
  localStorage.removeItem(CREDENTIAL_KEY)
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
}
