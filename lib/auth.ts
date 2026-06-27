import { supabase } from './supabase'

// ── Phone → fake email (internal only) ───────────────────────
function phoneToEmail(phone: string): string {
  const normalized = phone
    .replace(/[\s\-\(\)\+]/g, '')
    .replace(/^20/, '')
    .replace(/^0/, '')
  return `${normalized}@alignwithenjy.app`
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-\(\)\+]/g, '')
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`
  return `+20${digits}`
}

// ── REGISTER ─────────────────────────────────────────────────
export async function registerUser(
  fullName: string,
  phone: string,
  password: string
) {
  const normalizedPhone = normalizePhone(phone)
  const fakeEmail = phoneToEmail(phone)

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: fakeEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: normalizedPhone,
      },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('Phone number already registered. Try signing in.')
    }
    throw new Error(authError.message)
  }
  if (!authData.user) throw new Error('Registration failed')

  return { success: true }
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function loginUser(phoneOrEmail: string, password: string) {
  let email = phoneOrEmail.trim()

  // If not an email → treat as phone → convert to fake email
  if (!email.includes('@')) {
    email = phoneToEmail(email)
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login')) {
      throw new Error('Wrong phone number or password.')
    }
    throw new Error(error.message)
  }
  if (!data.user) throw new Error('Login failed')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', data.user.id)
    .single()

  if (profileError) throw new Error('User profile not found')

  if (profile.status === 'pending') {
    await supabase.auth.signOut()
    throw new Error('PENDING')
  }

  if (profile.status === 'rejected') {
    await supabase.auth.signOut()
    throw new Error('REJECTED')
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('saved_role', profile.role)
  }

  return { user: profile, session: data.session }
}

// ── LOGOUT ────────────────────────────────────────────────────
export async function logoutUser() {
  await supabase.auth.signOut()
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', '/login')
  }
}

// ── GET CURRENT USER ─────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', session.user.id)
    .single()

  return profile || null
}

// ── GET SESSION ──────────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
