import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, resetPassword } from './auth.js'

export function openAuthModal() {
  showSignIn()
  document.getElementById('auth-modal').style.display = 'flex'
}

export function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none'
}

export function showSignIn() {
  document.getElementById('auth-form-signin').style.display = 'block'
  document.getElementById('auth-form-signup').style.display = 'none'
  document.getElementById('auth-modal-title').textContent = 'Sign in'
  clearErrors()
}

export function showSignUp() {
  document.getElementById('auth-form-signin').style.display = 'none'
  document.getElementById('auth-form-signup').style.display = 'block'
  document.getElementById('auth-modal-title').textContent = 'Create account'
  clearErrors()
}

function clearErrors() {
  ['auth-error', 'auth-signup-error', 'auth-signup-success'].forEach(id => {
    const el = document.getElementById(id)
    if (el) { el.style.display = 'none'; el.textContent = '' }
  })
}

function showError(id, message) {
  const el = document.getElementById(id)
  if (el) { el.textContent = message; el.style.display = 'block' }
}

export async function handleEmailSignIn() {
  const email = document.getElementById('auth-email')?.value?.trim()
  const password = document.getElementById('auth-password')?.value
  if (!email || !password) return showError('auth-error', 'Please fill in all fields.')
  try {
    await signInWithEmail(email, password)
    closeAuthModal()
    if (window.showSheetFeedback) window.showSheetFeedback('Signed in — syncing...')
  } catch (err) {
    showError('auth-error', err.message || 'Sign in failed. Please try again.')
  }
}

export async function handleEmailSignUp() {
  const email = document.getElementById('auth-signup-email')?.value?.trim()
  const password = document.getElementById('auth-signup-password')?.value
  if (!email || !password) return showError('auth-signup-error', 'Please fill in all fields.')
  if (password.length < 6) return showError('auth-signup-error', 'Password must be at least 6 characters.')
  try {
    await signUpWithEmail(email, password)
    const success = document.getElementById('auth-signup-success')
    if (success) { success.textContent = 'Account created! Check your email to confirm.'; success.style.display = 'block' }
  } catch (err) {
    showError('auth-signup-error', err.message || 'Sign up failed. Please try again.')
  }
}

export async function handleGoogleSignIn() {
  try {
    await signInWithGoogle()
  } catch (err) {
    showError('auth-error', err.message || 'Google sign in failed.')
  }
}

export async function handleSignOut() {
  try {
    await signOut()
    if (window.showSheetFeedback) window.showSheetFeedback('Signed out')
  } catch (err) {
    console.warn('Sign out error:', err)
  }
}

export async function handleForgotPassword() {
  const email = document.getElementById('auth-email')?.value?.trim()
  if (!email) return showError('auth-error', 'Enter your email first.')
  try {
    await resetPassword(email)
    const el = document.getElementById('auth-error')
    if (el) { el.textContent = 'Password reset email sent!'; el.style.color = '#2e7d32'; el.style.display = 'block' }
  } catch (err) {
    showError('auth-error', err.message || 'Failed to send reset email.')
  }
}
