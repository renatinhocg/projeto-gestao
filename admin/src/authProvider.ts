import { AuthProvider } from 'react-admin'

const authProvider: AuthProvider = {
  login: async ({ username, password }: any) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: username, password })
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    localStorage.setItem('token', data.token)
  },
  logout: async () => {
    localStorage.removeItem('token')
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject()
    return Promise.resolve()
  },
  // react-admin calls checkError with an error from dataProvider; reject to redirect to login
  checkError: (error: any) => {
    const status = (error && error.status) || (error && error.message && error.message.status) || null
    if (status === 401 || status === 403) {
      localStorage.removeItem('token')
      return Promise.reject()
    }
    return Promise.resolve()
  },
  getPermissions: () => Promise.resolve(),
  getIdentity: async () => {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject()

    try {
      // Decode JWT to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.sub

      // Fetch user data from API
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })

      if (!res.ok) return Promise.reject()

      const user = await res.json()
      return {
        id: user.id,
        fullName: user.name || user.email,
        avatar: user.photoUrl,
        isAdmin: user.isAdmin
      }
    } catch (err) {
      console.error('Failed to get identity:', err)
      return Promise.reject()
    }
  }
}

export default authProvider
