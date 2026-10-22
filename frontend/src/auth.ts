
export type AuthUser = {
  email: string
  role: string
  employeeId?: number | string
}

type LoginResponse = {
  email?: string
  role?: string
  employeeId?: number | string
  message?: string
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data: LoginResponse = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? 'Login failed. Check your credentials.')
  }

  if (!data.email || !data.role) {
    throw new Error('The server returned an invalid login response.')
  }

  return {
    email: data.email,
    role: data.role,
    employeeId: data.employeeId,
  }
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Logout failed. Please try again.')
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', {
    credentials: 'same-origin',
  })

  if (response.status === 401 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new Error('Could not check the current login session.')
  }

  const data: LoginResponse = await response.json()

  if (!data.email || !data.role) {
    return null
  }

  return {
    email: data.email,
    role: data.role,
    employeeId: data.employeeId,
  }
}
