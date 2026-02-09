import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="animate-pulse rounded-lg bg-muted w-96 h-64" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
