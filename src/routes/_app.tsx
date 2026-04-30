import { createFileRoute, Outlet, Navigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { useUserProfile } from '@/hooks/useUserProfile'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { user, initialized } = useAuthStore()
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.uid)
  const { pathname } = useLocation()

  if (!initialized || (user && profileLoading)) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />

  const hasFamily = !!profile?.familyId
  const isOnboarding = pathname === '/onboarding'

  if (!hasFamily && !isOnboarding) return <Navigate to="/onboarding" replace />
  if (hasFamily && isOnboarding) return <Navigate to="/" replace />

  return <Outlet />
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
