import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Placeholder mientras baja el chunk de la vista. */
function ViewFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/** Shell de la app autenticada: Sidebar (md+) + Topbar (< md) + contenido. */
export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-8 md:px-10 md:py-12">
          <div className="mx-auto w-full max-w-5xl">
            <ErrorBoundary>
              <Suspense fallback={<ViewFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
