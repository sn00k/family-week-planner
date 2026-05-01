import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { doc, updateDoc, arrayRemove, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { EventSheet } from '@/components/calendar/EventSheet'

export const Route = createFileRoute('/_app/_calendar/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, signOut } = useAuthStore()
  const { data: profile } = useUserProfile(user?.uid)
  const { data: family } = useFamily(profile?.familyId)
  const { permission, enable, loading: notifLoading, isSupported } = usePushNotifications(user?.uid)
  const { canInstall, install, isIOS, isStandalone } = useInstallPrompt()
  const [familyName, setFamilyName] = useState(family?.name ?? '')
  const [renaming, setRenaming] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const close = () => navigate({ to: '/' })
  const isAdmin = user?.uid === family?.adminId

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  const handleRename = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile?.familyId || !familyName.trim() || familyName === family?.name) return
    setRenaming(true)
    try {
      await updateDoc(doc(db, 'families', profile.familyId), { name: familyName.trim() })
      queryClient.invalidateQueries({ queryKey: ['family', profile.familyId] })
    } finally {
      setRenaming(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !profile?.familyId) return
    if (!confirm('Är du säker på att du vill lämna familjen?')) return
    setLeaving(true)
    try {
      await updateDoc(doc(db, 'families', profile.familyId), {
        members: arrayRemove(user.uid),
      })
      await updateDoc(doc(db, 'users', user.uid), { familyId: deleteField() })
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] })
      close()
    } finally {
      setLeaving(false)
    }
  }

  return (
    <EventSheet title="Inställningar" onClose={close}>
      <div className="space-y-6">

        {/* Family name */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Familj</h3>
          {isAdmin ? (
            <form onSubmit={handleRename} className="flex gap-2">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={renaming || familyName === family?.name || !familyName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-colors"
              >
                {renaming ? '…' : 'Spara'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-700 px-1">{family?.name}</p>
          )}
        </section>

        {/* Push notifications */}
        {isSupported && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Aviseringar</h3>
            {permission === 'granted' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-1">
                  <span className="text-green-500 text-lg">🔔</span>
                  <p className="text-sm text-gray-700">Push-aviseringar är aktiverade</p>
                </div>
                <button
                  onClick={enable}
                  disabled={notifLoading}
                  className="w-full py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {notifLoading ? 'Förnyar…' : 'Förnya push-token'}
                </button>
              </div>
            ) : permission === 'denied' ? (
              <div className="flex items-start gap-3 py-1">
                <span className="text-gray-400 text-lg">🔕</span>
                <p className="text-sm text-gray-500">
                  Aviseringar är blockerade. Aktivera dem i webbläsarens inställningar.
                </p>
              </div>
            ) : (
              <button
                onClick={enable}
                disabled={notifLoading}
                className="w-full py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {notifLoading ? 'Aktiverar…' : '🔔 Aktivera push-aviseringar'}
              </button>
            )}
          </section>
        )}

        {/* Install app */}
        {!isStandalone && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">App</h3>
            {canInstall ? (
              <button
                onClick={install}
                className="w-full py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
              >
                📲 Installera app på hemskärmen
              </button>
            ) : isIOS ? (
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-800 mb-2">Lägg till på hemskärmen</p>
                <p>1. Tryck på delningsikonen <span className="font-mono bg-gray-200 px-1 rounded">⎙</span> i Safari</p>
                <p>2. Välj "Lägg till på hemskärmen"</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 px-1">Appen är redan installerad eller kan inte installeras i den här webbläsaren.</p>
            )}
          </section>
        )}

        {/* Account */}
        <section className="pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Logga ut
          </button>
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-2.5 text-red-500 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50"
          >
            {leaving ? 'Lämnar…' : 'Lämna familjen'}
          </button>
        </section>
      </div>
    </EventSheet>
  )
}
