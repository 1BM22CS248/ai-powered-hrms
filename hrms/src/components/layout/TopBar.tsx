import { Menu, Sun, Moon } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../ui/button'

export function TopBar() {
  const toggleSidebar = useUiStore(s => s.toggleSidebar)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className="fixed top-0 right-0 left-0 h-14 border-b bg-card flex items-center justify-between px-4 z-30">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
