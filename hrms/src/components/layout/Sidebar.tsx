import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Users, Building2, Calendar, ClipboardList,
  DollarSign, BarChart2, Briefcase, Headphones, Bell, UserCheck,
  FileBarChart, Shield, Settings, GitBranch, LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'
import { getInitials } from '../../lib/format'
import type { Role } from '../../data/types'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles?: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['HR_ADMIN', 'MANAGER'] },
  { to: '/org-chart', icon: GitBranch, label: 'Org Chart' },
  { to: '/attendance', icon: Calendar, label: 'Attendance', roles: ['HR_ADMIN', 'MANAGER'] },
  { to: '/my-attendance', icon: Calendar, label: 'My Attendance', roles: ['EMPLOYEE'] },
  { to: '/leave', icon: ClipboardList, label: 'Leave Requests', roles: ['HR_ADMIN', 'MANAGER'] },
  { to: '/my-leave', icon: ClipboardList, label: 'My Leave', roles: ['EMPLOYEE'] },
  { to: '/payroll', icon: DollarSign, label: 'Payroll', roles: ['HR_ADMIN'] },
  { to: '/my-payroll', icon: DollarSign, label: 'My Payroll', roles: ['EMPLOYEE'] },
  { to: '/performance', icon: BarChart2, label: 'Performance' },
  { to: '/recruitment', icon: Briefcase, label: 'Recruitment', roles: ['HR_ADMIN', 'MANAGER'] },
  { to: '/helpdesk', icon: Headphones, label: 'Helpdesk' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/onboarding', icon: UserCheck, label: 'Onboarding' },
  { to: '/reports', icon: FileBarChart, label: 'Reports', roles: ['HR_ADMIN', 'MANAGER'] },
  { to: '/audit', icon: Shield, label: 'Audit Log', roles: ['HR_ADMIN'] },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  const setSidebarOpen = useUiStore(s => s.setSidebarOpen)
  const location = useLocation()

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname, setSidebarOpen])

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user.role)
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col bg-card border-r transition-all duration-300 z-50',
        // Width: full when open, icon-only (w-16) when closed on desktop
        sidebarOpen ? 'w-[var(--sidebar-width)]' : 'w-16',
        // Mobile: slide off-screen when closed; Desktop: always visible
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-sm font-bold">H</span>
        </div>
        {sidebarOpen && <span className="font-semibold text-sm truncate">HRMS</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors mb-0.5',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-3 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {sidebarOpen && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </aside>
  )
}
