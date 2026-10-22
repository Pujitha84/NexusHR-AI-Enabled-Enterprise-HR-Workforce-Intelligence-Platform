
import { useEffect, useState } from 'react'
import App from './App'
import Login from './Login'
import { getCurrentUser, login, logout, type AuthUser } from './auth'

export default function AuthGate() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) setError('Could not connect to the server. Please try again.')
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLogin(email: string, password: string) {
    const loggedInUser = await login(email, password)
    setUser(loggedInUser)
  }

  async function handleLogout() {
    try {
      await logout()
      setUser(null)
      setError('')
    } catch {
      setError('Logout failed. Please try again.')
    }
  }

  if (checking) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <div className="login-logo">N</div>
            <span>NexusHR</span>
          </div>
          <p className="login-description">Checking your secure session…</p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <>
        {error && (
          <p role="alert" style={{ textAlign: 'center', color: '#b42318' }}>
            {error}
          </p>
        )}
        <Login onLogin={handleLogin} />
      </>
    )
  }

  return (
    <>
      <header
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 14,
          padding: '10px 20px',
          background: '#fff',
          borderBottom: '1px solid #e8ecf4',
          color: '#182338',
          fontSize: 13,
        }}
      >
        <span>{user.email} · {user.role}</span>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: '8px 13px',
            border: '1px solid #dfe4ee',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>
      {error && (
        <p role="alert" style={{ padding: '0 20px', color: '#b42318' }}>
          {error}
        </p>
      )}
      <App />
    </>
  )
}
