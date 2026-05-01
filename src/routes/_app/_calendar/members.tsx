import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { EventSheet } from '@/components/calendar/EventSheet'

export const Route = createFileRoute('/_app/_calendar/members')({
  component: MembersPage,
})

function MembersPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: profile } = useUserProfile(user?.uid)
  const { data: family } = useFamily(profile?.familyId)
  const { data: members = [] } = useFamilyMembers(family?.members)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const close = () => navigate({ to: '/' })

  useEffect(() => {
    if (!profile?.familyId) return
    const q = query(
      collection(db, 'inviteCodes'),
      where('familyId', '==', profile.familyId),
    )
    getDocs(q).then((snap) => {
      if (!snap.empty) setInviteCode(snap.docs[0].id)
    })
  }, [profile?.familyId])

  const handleCopy = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <EventSheet title="Familjemedlemmar" onClose={close}>
      <div className="space-y-5">
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.uid} className="flex items-center gap-3 py-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: member.color }}
              >
                {member.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.displayName}
                  {member.uid === family?.adminId && (
                    <span className="ml-2 text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
              </div>
            </div>
          ))}
        </div>

        {inviteCode && (
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-2">Inbjudningskod</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xl font-mono font-bold text-gray-900 tracking-widest">
                {inviteCode}
              </p>
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                {copied ? 'Kopierat!' : 'Kopiera'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Dela koden med familjemedlemmar så de kan gå med.
            </p>
          </div>
        )}
      </div>
    </EventSheet>
  )
}
