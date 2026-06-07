/**
 * Role: all roles
 * Data: current user profile
 * API: none (mock, no mutations)
 * AI: none
 */
import { useAuthStore } from '../../../store/authStore'
import { useThemeStore } from '../../../store/themeStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar'
import { Switch } from '../../../components/ui/switch'
import { Label } from '../../../components/ui/label'
import { Separator } from '../../../components/ui/separator'
import { getInitials } from '../../../lib/format'
import { ROLES } from '../../../lib/constants'

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)!
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ROLES[user.role]} · {user.departmentName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark theme</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Employee ID</span>
            <span className="font-mono">{user.employeeId}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span>{ROLES[user.role]}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Department</span>
            <span>{user.departmentName}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
