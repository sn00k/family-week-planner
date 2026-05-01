import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import WeekView from '@/components/calendar/WeekView'

export const Route = createFileRoute('/_app/_calendar')({
  component: CalendarLayout,
})

function CalendarLayout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: profile } = useUserProfile(user?.uid)
  const { data: family } = useFamily(profile?.familyId)
  const { data: members = [] } = useFamilyMembers(family?.members)

  if (!profile?.familyId || !family) return null

  return (
    <>
      <WeekView
        familyId={profile.familyId}
        familyName={family.name}
        members={members}
        onAddEvent={() => navigate({ to: '/events/new' })}
        onEventClick={(id) =>
          navigate({ to: '/events/$eventId', params: { eventId: id } })
        }
        onMembersClick={() => navigate({ to: '/members' })}
        onSettingsClick={() => navigate({ to: '/settings' })}
      />
      <Outlet />
    </>
  )
}
