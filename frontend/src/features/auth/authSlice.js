import { createSlice } from '@reduxjs/toolkit'

const TOKEN_KEY = 'fff.token'
const USER_KEY = 'fff.user'

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialState = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: loadUser(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.token
      state.user = payload.user
      localStorage.setItem(TOKEN_KEY, payload.token)
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    },
    setUser(state, { payload }) {
      state.user = payload
      localStorage.setItem(USER_KEY, JSON.stringify(payload))
    },
    clearCredentials(state) {
      state.token = null
      state.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export const { setCredentials, setUser, clearCredentials } = authSlice.actions
export default authSlice.reducer

export const selectToken = (state) => state.auth.token
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
