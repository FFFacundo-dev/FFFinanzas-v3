import { useDispatch, useSelector } from 'react-redux'
import { SignOut, Moon, Sun, User, CaretUpDown } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { selectUser, clearCredentials } from '@/features/auth/authSlice'
import { selectTheme, toggleTheme } from '@/features/ui/uiSlice'

export function UserMenu() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const theme = useSelector(selectTheme)
  const isDark = theme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-secondary text-foreground">
          <User className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate">{user?.email ?? 'Cuenta'}</span>
        <CaretUpDown className="h-4 w-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => dispatch(toggleTheme())}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => dispatch(clearCredentials())}
          className="text-destructive focus:text-destructive"
        >
          <SignOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
