import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Toaster } from '@/components/ui/sonner'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
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

export default function App() {
  useThemeSync()
  const isAuthenticated = useSelector(selectIsAuthenticated)

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
