import { useState } from 'react'
import { List } from '@phosphor-icons/react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Brand } from './Brand'
import { NavList } from './NavList'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'
import { RemainingBar } from '@/features/remaining/RemainingBar'

/**
 * Header persistente (todas las pantallas): el hamburger + brand solo aparecen
 * en < md; la barra de "dinero restante" se muestra siempre, a la derecha.
 */
export function Topbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4">
      {/* Mobile: drawer + brand */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menú" className="md:hidden">
            <List className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-64 flex-col gap-0 p-0">
          <div className="flex h-16 items-center px-6">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-border p-3">
            <UserMenu />
          </div>
        </SheetContent>
      </Sheet>
      <Brand className="text-lg md:hidden" />

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <div className="min-w-0">
          <RemainingBar />
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
