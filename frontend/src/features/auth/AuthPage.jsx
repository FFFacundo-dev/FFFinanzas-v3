import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Brand } from '@/components/layout/Brand'
import { useLoginMutation, useRegisterMutation } from './authApi'

export function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [login, loginState] = useLoginMutation()
  const [register, registerState] = useRegisterMutation()
  const isLogin = mode === 'login'
  const loading = loginState.isLoading || registerState.isLoading

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (isLogin) {
        await login({ email, password }).unwrap()
      } else {
        await register({ email, password, preferredLanguage: 'es' }).unwrap()
      }
      // El éxito redirige solo (cambia el auth gating en App).
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo continuar')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Brand className="text-2xl" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? 'Ingresá a tu fondo único' : 'Creá tu cuenta (solo invitados)'}
          </p>
        </div>

        <Card className="shadow-subtle">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@ejemplo.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                {loading
                  ? 'Un momento…'
                  : isLogin
                    ? 'Ingresar'
                    : 'Crear cuenta'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            type="button"
            onClick={() => setMode(isLogin ? 'register' : 'login')}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? 'Registrate' : 'Ingresá'}
          </button>
        </p>
      </div>
    </div>
  )
}
