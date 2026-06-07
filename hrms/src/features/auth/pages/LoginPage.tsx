/**
 * Role: public (guest only)
 * Data: none
 * API: getEmployeeByEmail (via authStore.login)
 * AI: none
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { DEMO_ROLES } from '../../../lib/constants'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, demoLogin, isLoading, error } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })
  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  function validate() {
    const errs = { email: '', password: '' }
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (!password) errs.password = 'Password is required'
    setFieldErrors(errs)
    return !errs.email && !errs.password
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const ok = await login(email, password)
    if (ok) navigate('/dashboard', { replace: true })
  }

  async function quickLogin(item: { role: 'admin' | 'manager' | 'employee'; label: string }) {
    setQuickLoading(item.label)
    const ok = await demoLogin(item.role)
    setQuickLoading(null)
    if (ok) navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <span className="text-primary-foreground text-xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold">HRMS</h1>
          <p className="text-muted-foreground text-sm mt-1">Human Resource Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                />
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>

              {error && (
                <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* Quick login */}
            <div className="mt-5">
              <div className="relative flex items-center mb-3">
                <div className="flex-1 border-t" />
                <span className="px-2 text-xs text-muted-foreground">or sign in as</span>
                <div className="flex-1 border-t" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ROLES.map(c => (
                  <button
                    key={c.role}
                    type="button"
                    disabled={isLoading || quickLoading !== null}
                    onClick={() => quickLogin(c)}
                    className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg border bg-muted/30 hover:bg-accent hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-xs font-semibold leading-none text-center">
                      {quickLoading === c.label ? '…' : c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
