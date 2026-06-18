import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navItems } from './navItems'

/** Lista de navegación compartida por Sidebar (md+) y MobileNav (Sheet). */
export function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors',
              'text-muted-foreground hover:bg-accent hover:text-foreground',
              isActive && 'bg-accent text-foreground font-medium',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                weight={isActive ? 'fill' : 'regular'}
              />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
