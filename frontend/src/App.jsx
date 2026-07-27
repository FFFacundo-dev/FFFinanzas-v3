import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { selectIsAuthenticated, clearCredentials } from '@/features/auth/authSlice'
import { selectTheme } from '@/features/ui/uiSlice'
import { AppShell } from '@/components/layout/AppShell'
import { AuthPage } from '@/features/auth/AuthPage'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { TransactionsView } from '@/features/transactions/TransactionsView'
import { InstallmentsView } from '@/features/installments/InstallmentsView'
import { SubscriptionsView } from '@/features/subscriptions/SubscriptionsView'
import { GoalsView } from '@/features/goals/GoalsView'
import { BudgetView } from '@/features/budget/BudgetView'
import { SettingsView } from '@/features/settings/SettingsView'

/** Aplica el tema (clase .dark en <html>) desde el uiSlice. */
function useThemeSync() {
  const theme = useSelector(selectTheme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])
}

const IDLE_MS = 20 * 60 * 1000 // 20 min: desloguea por inactividad para no mostrar datos vacíos.

/** Cierra la sesión tras 20 min sin actividad del usuario. */
function useIdleLogout(isAuthenticated) {
  const dispatch = useDispatch()
  useEffect(() => {
    if (!isAuthenticated) return
    let timer
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        dispatch(clearCredentials())
        toast.info('Sesión cerrada por inactividad')
      }, IDLE_MS)
    }
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [isAuthenticated, dispatch])
}

export default function App() {
  useThemeSync()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  useIdleLogout(isAuthenticated)

  return (
    <>
      {isAuthenticated ? (
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardView />} />
            <Route path="movimientos" element={<TransactionsView />} />
            <Route path="cuotas" element={<InstallmentsView />} />
            <Route path="subs" element={<SubscriptionsView />} />
            <Route path="metas" element={<GoalsView />} />
            <Route path="presupuesto" element={<BudgetView />} />
            <Route path="ajustes" element={<SettingsView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <AuthPage />
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{ classNames: { toast: 'font-sans' } }}
      />
    </>
  )
}
