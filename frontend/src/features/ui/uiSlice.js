import { createSlice } from '@reduxjs/toolkit'

const THEME_KEY = 'fff.theme'

function initialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark' // dark mode por default (PLAN §5.1)
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: initialTheme(),
  },
  reducers: {
    setTheme(state, { payload }) {
      state.theme = payload
      localStorage.setItem(THEME_KEY, payload)
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, state.theme)
    },
  },
})

export const { setTheme, toggleTheme } = uiSlice.actions
export default uiSlice.reducer

export const selectTheme = (state) => state.ui.theme
