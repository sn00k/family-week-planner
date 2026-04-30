import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { user, initialized } = useAuthStore()

  if (!initialized) return <FullScreenSpinner />
  if (user) return <Navigate to="/" />

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Outlet />
    </div>
  )
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
