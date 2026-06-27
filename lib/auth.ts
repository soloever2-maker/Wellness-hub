import { supabase } from './supabase'

// ── REGISTER ─────────────────────────────────────────────────
export async function registerUser(
  fullName: string,
  phone: string,
  email: string,
  password: string
) {
  const normalizedPhone = phone.startsWith('+20')
    ? phone
    : `+20${phone.replace(/^0/, '')}`

  // Create auth user + pass metadata (trigger will create the profile automatically)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: normalizedPhone,
      },
    },
  })

  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Registration failed')

  return { success: true }
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Login failed')

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', data.user.id)
    .single()

  if (profileError) throw new Error('User profile not found')

  // Check approval status
  if (profile.status === 'pending') {
    await supabase.auth.signOut()
    throw new Error('PENDING')
  }

  if (profile.status === 'rejected') {
    await supabase.auth.signOut()
    throw new Error('REJECTED')
  }

  // Save role for biometric login redirect
  if (typeof window !== 'undefined') {
    localStorage.setItem('saved_role', profile.role)
  }

  return { user: profile, session: data.session }
}

// ── LOGOUT ────────────────────────────────────────────────────
export async function logoutUser() {
  await supabase.auth.signOut()

  // Clear all history entries so back button can't return to protected pages
  if (typeof window !== 'undefined') {
    // Replace current history entry with login
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

// ── CHECK SESSION ─────────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
