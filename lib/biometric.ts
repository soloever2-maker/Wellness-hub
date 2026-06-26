// WebAuthn Biometric Authentication
// Works on: Android Chrome (fingerprint), iOS Safari (Face ID / Touch ID)

const CREDENTIAL_KEY = 'biometric_credential_id'
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'
const USER_EMAIL_KEY = 'saved_email'

// Check if biometrics is supported on this device
export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
}

// Check if biometric is already enabled
export function isBiometricEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
}

// Get saved email
export function getSavedEmail(): string {
  return localStorage.getItem(USER_EMAIL_KEY) || ''
}

// Save email for biometric login
export function saveEmail(email: string) {
  localStorage.setItem(USER_EMAIL_KEY, email)
}

// Register biometric (called after password verification)
export async function registerBiometric(email: string): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const userId = new TextEncoder().encode(email)

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Align with Enjy',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null

    if (!credential) return false

    localStorage.setItem(CREDENTIAL_KEY, credential.id)
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true')
    localStorage.setItem(USER_EMAIL_KEY, email)
    return true
  } catch {
    return false
  }
}

// Authenticate with biometric
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const credentialId = localStorage.getItem(CREDENTIAL_KEY)
    if (!credentialId) return false

    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })

    return !!credential
  } catch {
    return false
  }
}

// Disable biometric
export function disableBiometric() {
  localStorage.removeItem(CREDENTIAL_KEY)
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
}
