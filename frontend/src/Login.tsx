
import { useState, type FormEvent } from 'react'
import './Login.css'

type LoginProps = {
  onLogin: (email: string, password: string) => Promise<void>
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">N</div>
          <span>NexusHR</span>
        </div>

        <p className="login-eyebrow">WORKFORCE INTELLIGENCE</p>
        <h1>Welcome back</h1>
        <p className="login-description">
          Sign in to your workspace to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Work email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-footer">
          Secure access to your HR workspace
        </p>
      </section>
    </main>
  )
}
