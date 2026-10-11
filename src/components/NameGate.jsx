import { useState } from 'react'
import { useUser } from '../context/UserContext'

function Logo() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <img
      src="/images/logo.png"
      alt=""
      onError={() => setHidden(true)}
      className="w-25 h-25 object-contain mx-auto mb-1"
    />
  )
}

export default function NameGate() {
  const { loginAsCustomer, loginAsAdmin } = useUser()
  const [mode, setMode] = useState('customer') // 'customer' | 'admin'

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCustomerSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Enter your name to continue')
      return
    }
    setNameError('')
    loginAsCustomer(name)
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setAdminError('')
    setSubmitting(true)
    try {
      await loginAsAdmin(email.trim(), password)
    } catch {
      setAdminError('Wrong email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
        <div>
          <Logo />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-accent)' }}>
            Funix Lil-Cafe
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            {mode === 'customer' ? 'Order ahead with Ryn, Zack & Vel' : 'Admin Sign in'}
          </p>
        </div>

        {mode === 'customer' ? (
          <form onSubmit={handleCustomerSubmit} className="w-full flex flex-col items-center gap-4">
            <div className="w-full">
              <input
                className="input-field w-full px-4 py-3 text-sm outline-none"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError && (
                <p className="mt-2 text-xs text-left" style={{ color: 'var(--color-danger)' }}>
                  {nameError}
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-sm">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit} className="w-full flex flex-col items-center gap-3">
            <input
              className="input-field w-full px-4 py-3 text-sm outline-none"
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input-field w-full px-4 py-3 text-sm outline-none"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {adminError && (
              <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                {adminError}
              </p>
            )}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === 'customer' ? 'admin' : 'customer')}
          className="text-xs underline"
          style={{ color: 'var(--color-muted)' }}
        >
          {mode === 'customer' ? 'Ryn, Zack or Vel? Sign in here' : 'Not an admin? Enter your name instead'}
        </button>
      </div>
    </div>
  )
}
