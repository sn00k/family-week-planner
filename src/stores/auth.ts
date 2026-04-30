import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthStore {
  user: User | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const googleProvider = new GoogleAuthProvider()

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email, password) => {
    set({ loading: true })
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true })
    try {
      await signInWithPopup(auth, googleProvider)
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth)
  },
}))

onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, initialized: true })
})
