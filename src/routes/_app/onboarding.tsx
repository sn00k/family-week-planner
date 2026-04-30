import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import {
  doc,
  collection,
  writeBatch,
  runTransaction,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { queryClient } from '@/lib/queryClient'
import { MEMBER_COLORS } from '@/lib/colors'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

type Mode = 'create' | 'join'

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function OnboardingPage() {
  const { user } = useAuthStore()
  const [mode, setMode] = useState<Mode>('create')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const familyRef = doc(collection(db, 'families'))
      const familyId = familyRef.id
      const code = generateCode()
      const now = Timestamp.now()
      const batch = writeBatch(db)

      batch.set(familyRef, {
        name: familyName.trim(),
        adminId: user.uid,
        members: [user.uid],
        createdAt: now,
      })

      batch.set(doc(db, 'inviteCodes', code), {
        familyId,
        createdBy: user.uid,
        createdAt: now,
      })

      batch.set(doc(db, 'users', user.uid), {
        displayName: user.displayName ?? user.email ?? '',
        email: user.email ?? '',
        color: MEMBER_COLORS[0].hex,
        familyId,
        createdAt: now,
      })

      await batch.commit()
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] })
    } catch {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const normalizedCode = inviteCode.trim().toUpperCase()

      await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(doc(db, 'inviteCodes', normalizedCode))
        if (!codeSnap.exists()) throw new Error('INVALID_CODE')

        const { familyId } = codeSnap.data()
        const familyRef = doc(db, 'families', familyId)
        const familySnap = await transaction.get(familyRef)
        if (!familySnap.exists()) throw new Error('INVALID_CODE')

        const memberCount: number = familySnap.data().members.length
        const color = MEMBER_COLORS[memberCount % MEMBER_COLORS.length].hex

        transaction.update(familyRef, { members: arrayUnion(user.uid) })
        transaction.set(doc(db, 'users', user.uid), {
          displayName: user.displayName ?? user.email ?? '',
          email: user.email ?? '',
          color,
          familyId,
          createdAt: Timestamp.now(),
        })
      })

      queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] })
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CODE') {
        setError('Den här koden finns inte. Kontrollera att du skriver rätt.')
      } else {
        setError('Något gick fel. Försök igen.')
      }
    } finally {
      setLoading(false)
    }
  }

  const firstName = user?.displayName?.split(' ')[0] ?? 'där'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
            📅
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Välkommen, {firstName}!</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Skapa eller gå med i en familjegrupp för att komma igång.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          {/* Tab toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
            <button
              onClick={() => { setMode('create'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'create'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Skapa grupp
            </button>
            <button
              onClick={() => { setMode('join'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'join'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gå med med kod
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Familjens namn
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="t.ex. Familjen Nilsson"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Skapar grupp…' : 'Skapa familjegrupp'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Inbjudningskod
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  placeholder="ABC123"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-sm font-mono tracking-widest uppercase"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Söker kod…' : 'Gå med i gruppen'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
