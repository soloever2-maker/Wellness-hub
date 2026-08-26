// Align with Enjy — Biometric Login (hybrid)
//
// Strategy (unchanged in spirit): biometric acts as a GATE to stored
// credentials. The fingerprint / Face ID protects the saved email+password,
// it doesn't replace them — so it survives session expiry and logout.
//
// Two implementations behind ONE public API (callers need no changes):
//   • Native shell (iOS/Android via Capacitor) → @capgo/capacitor-native-biometric
//       Real device biometrics + secure Keychain (iOS) / Keystore (Android).
//   • Browser / PWA → WebAuthn (navigator.credentials), exactly as before.
//
// All exported functions keep their original names and signatures. The
// sync ones (isBiometricSupported/isBiometricEnabled/getSavedEmail) stay sync
// by reading a tiny localStorage flag; the actual biometric prompt happens in
// the async enable/get functions.

const BIOMETRIC_KEY = 'align_bio'          // web (WebAuthn) blob
const ROLE_KEY = 'saved_role'
const NATIVE_FLAG_KEY = 'align_bio_native' // native: stores { email } once enabled
const NATIVE_SERVER = 'alignwithenjy.app'  // keychain/keystore namespace

type StoredCreds = {
  email: string
  pwd: string // base64 encoded
  credential_id: string
}

// ── Native plugin access ────────────────────────────────────────
function getNativeBiometric(): any | null {
  if (typeof window === 'undefined') return null
  const cap = (window as any).Capacitor
  if (!cap?.isNativePlatform?.()) return null
  return cap?.Plugins?.NativeBiometric || null
}

function isNativeShell(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as any).Capacitor
  return !!cap?.isNativePlatform?.()
}

// ── Feature detection ───────────────────────────────────────────
export function isBiometricSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (isNativeShell()) return true // native plugin handles the real check
  return (
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  )
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  const native = getNativeBiometric()
  if (native) {
    try {
      const r = await native.isAvailable()
      return !!r?.isAvailable
    } catch {
      return false
    }
  }
  if (!isBiometricSupported()) return false
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// Enabled = we have a stored gate (native flag OR web blob).
export function isBiometricEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(NATIVE_FLAG_KEY) || !!localStorage.getItem(BIOMETRIC_KEY)
}

// Is biometric actually usable on THIS platform right now?
// In the native shell, only the native flag counts — an old web (WebAuthn)
// blob left over from before the upgrade doesn't work here, so we don't show
// the biometric button for it (the user signs in with a password and re-enables).
// In the browser, the web blob is what counts.
export function isBiometricReady(): boolean {
  if (typeof window === 'undefined') return false
  if (isNativeShell()) return !!localStorage.getItem(NATIVE_FLAG_KEY)
  return !!localStorage.getItem(BIOMETRIC_KEY)
}

export function hasBiometricSession(): boolean {
  return isBiometricEnabled()
}

export function getSavedEmail(): string {
  try {
    const nativeRaw = localStorage.getItem(NATIVE_FLAG_KEY)
    if (nativeRaw) {
      const n = JSON.parse(nativeRaw)
      if (n?.email) return n.email
    }
    const raw = localStorage.getItem(BIOMETRIC_KEY)
    if (!raw) return ''
    const creds: StoredCreds = JSON.parse(raw)
    return creds.email || ''
  } catch {
    return ''
  }
}

export function getSavedRole(): string {
  return localStorage.getItem(ROLE_KEY) || 'client'
}

export function saveRole(role: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLE_KEY, role)
  }
}

export function saveEmail(_email: string) {
  // No-op — email is stored inside the biometric blob / native flag
}

// ── Encoding helpers (web WebAuthn) ─────────────────────────────
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return buffer
}

// ── ENABLE — store credentials behind the biometric gate ────────
export async function enableBiometricLogin(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const native = getNativeBiometric()

  if (native) {
    try {
      const avail = await native.isAvailable()
      if (!avail?.isAvailable) {
        return { ok: false, error: 'Biometric authentication is not set up on this device.' }
      }
      await native.verifyIdentity({
        reason: 'Enable biometric login',
        title: 'Align with Enjy',
        subtitle: 'Confirm your identity',
        description: 'Verify to enable fingerprint / Face login',
      })
      await native.setCredentials({ username: email, password, server: NATIVE_SERVER })
      localStorage.setItem(NATIVE_FLAG_KEY, JSON.stringify({ email }))
      return { ok: true }
    } catch (err: any) {
      const msg = err?.message || 'Biometric setup was cancelled'
      return { ok: false, error: msg }
    }
  }

  try {
    if (!isBiometricSupported()) {
      return { ok: false, error: 'Biometric not supported on this device' }
    }

    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    const userIdBytes = new TextEncoder().encode(email)

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: challenge.buffer,
      rp: { name: 'Align with Enjy', id: window.location.hostname },
      user: { id: userIdBytes, name: email, displayName: email },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    }

    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
    if (!credential) return { ok: false, error: 'Biometric setup was cancelled' }

    const creds: StoredCreds = {
      email,
      pwd: btoa(password),
      credential_id: bufferToBase64Url(credential.rawId),
    }
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(creds))
    return { ok: true }
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    if (e?.name === 'NotAllowedError') return { ok: false, error: 'Biometric setup was cancelled' }
    if (e?.name === 'InvalidStateError') return { ok: false, error: 'Biometric already registered on this device' }
    return { ok: false, error: e?.message ?? 'Setup failed' }
  }
}

export async function registerBiometric(email: string, password: string): Promise<boolean> {
  const result = await enableBiometricLogin(email, password)
  return result.ok
}

// ── AUTHENTICATE — verify biometric then return credentials ─────
export async function getCredentialsViaBiometric(): Promise<
  | { ok: true; email: string; password: string }
  | { ok: false; error: string }
> {
  const native = getNativeBiometric()

  if (native) {
    try {
      if (!localStorage.getItem(NATIVE_FLAG_KEY)) {
        return {
          ok: false,
          error: "We've upgraded biometric login. Please sign in with your email and password once, then re-enable it from your Profile.",
        }
      }
      const avail = await native.isAvailable()
      if (!avail?.isAvailable) {
        return { ok: false, error: 'Biometric authentication is not available right now.' }
      }
      await native.verifyIdentity({
        reason: 'Log in to Align with Enjy',
        title: 'Align with Enjy',
        subtitle: 'Biometric login',
        description: 'Verify to sign in',
      })
      const creds = await native.getCredentials({ server: NATIVE_SERVER })
      if (!creds?.username || !creds?.password) {
        return { ok: false, error: 'Saved login not found. Please sign in again.' }
      }
      return { ok: true, email: creds.username, password: creds.password }
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Biometric verification cancelled' }
    }
  }

  try {
    if (!isBiometricSupported()) return { ok: false, error: 'Biometric not supported' }

    const raw = localStorage.getItem(BIOMETRIC_KEY)
    if (!raw) return { ok: false, error: 'No biometric setup found. Sign in with email/password first.' }

    const creds: StoredCreds = JSON.parse(raw)
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: challenge.buffer,
      rpId: window.location.hostname,
      allowCredentials: [{ type: 'public-key', id: base64UrlToBuffer(creds.credential_id) }],
      userVerification: 'required',
      timeout: 60000,
    }

    const result = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null
    if (!result) return { ok: false, error: 'Biometric verification cancelled' }

    return { ok: true, email: creds.email, password: atob(creds.pwd) }
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    if (e?.name === 'NotAllowedError') return { ok: false, error: 'Biometric cancelled' }
    return { ok: false, error: e?.message ?? 'Biometric verification failed' }
  }
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await getCredentialsViaBiometric()
  return result.ok
}

// ── SYNC PASSWORD — called after a password change ──────────────
export function updateStoredBiometricPassword(newPassword: string): void {
  if (typeof window === 'undefined') return

  const native = getNativeBiometric()
  if (native && localStorage.getItem(NATIVE_FLAG_KEY)) {
    try {
      const email = getSavedEmail()
      if (email) {
        native.setCredentials({ username: email, password: newPassword, server: NATIVE_SERVER })
          .catch(() => {})
      }
    } catch { /* ignore */ }
    return
  }

  try {
    const raw = localStorage.getItem(BIOMETRIC_KEY)
    if (!raw) return
    const creds: StoredCreds = JSON.parse(raw)
    creds.pwd = btoa(newPassword)
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(creds))
  } catch { /* ignore */ }
}

// ── DISABLE ─────────────────────────────────────────────────────
export function disableBiometric(): void {
  if (typeof window === 'undefined') return

  const native = getNativeBiometric()
  if (native) {
    try {
      native.deleteCredentials({ server: NATIVE_SERVER }).catch(() => {})
    } catch { /* ignore */ }
  }
  localStorage.removeItem(NATIVE_FLAG_KEY)
  localStorage.removeItem(BIOMETRIC_KEY)
}
