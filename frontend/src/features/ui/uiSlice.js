import { createSlice } from '@reduxjs/toolkit'

const THEME_KEY = 'fff.theme'
const REMAINING_MODE_KEY = 'fff.remainingMode'
const REMAINING_CURRENCIES_KEY = 'fff.remainingCurrencies'

// Modos del "dinero restante" (barra superior):
//  POZO        → saldo del pozo, tal cual
//  LIBRE       → saldo menos lo comprometido (fijos activos + cuotas por pagar)
//  PRESUPUESTO → saldo menos el presupuesto proyectado del mes
export const REMAINING_MODES = ['POZO', 'LIBRE', 'PRESUPUESTO']

function initialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark' // dark mode por default (PLAN §5.1)
}

function initialMode() {
  const saved = localStorage.getItem(REMAINING_MODE_KEY)
  return REMAINING_MODES.includes(saved) ? saved : 'POZO'
}

function initialCurrencies() {
  try {
    const raw = localStorage.getItem(REMAINING_CURRENCIES_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: initialTheme(),
    // "Dinero restante": vacío en remainingCurrencies = mostrar todas.
    remainingMode: initialMode(),
    remainingCurrencies: initialCurrencies(),
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
    setRemainingMode(state, { payload }) {
      if (!REMAINING_MODES.includes(payload)) return
      state.remainingMode = payload
      localStorage.setItem(REMAINING_MODE_KEY, payload)
    },
    toggleRemainingCurrency(state, { payload }) {
      const i = state.remainingCurrencies.indexOf(payload)
      if (i === -1) state.remainingCurrencies.push(payload)
      else state.remainingCurrencies.splice(i, 1)
      localStorage.setItem(
        REMAINING_CURRENCIES_KEY,
        JSON.stringify(state.remainingCurrencies),
      )
    },
  },
})

export const { setTheme, toggleTheme, setRemainingMode, toggleRemainingCurrency } =
  uiSlice.actions
export default uiSlice.reducer

export const selectTheme = (state) => state.ui.theme
export const selectRemainingMode = (state) => state.ui.remainingMode
export const selectRemainingCurrencies = (state) => state.ui.remainingCurrencies
