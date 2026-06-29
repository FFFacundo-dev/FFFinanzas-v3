import { useDispatch, useSelector } from 'react-redux'
import { Sun, Moon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { selectTheme, toggleTheme } from '@/features/ui/uiSlice'

/** Toggle de tema de un click, siempre visible en el Topbar. Reusa uiSlice. */
export function ThemeToggle() {
  const dispatch = useDispatch()
  const isDark = useSelector(selectTheme) === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 text-muted-foreground"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={() => dispatch(toggleTheme())}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
