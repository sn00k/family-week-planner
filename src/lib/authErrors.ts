export function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: string }).code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Felaktig e-post eller lösenord.'
      case 'auth/email-already-in-use':
        return 'Den här e-postadressen används redan.'
      case 'auth/weak-password':
        return 'Lösenordet är för svagt. Använd minst 6 tecken.'
      case 'auth/too-many-requests':
        return 'För många försök. Försök igen senare.'
      case 'auth/user-disabled':
        return 'Det här kontot har inaktiverats.'
      case 'auth/popup-closed-by-user':
        return ''
      default:
        return 'Något gick fel. Försök igen.'
    }
  }
  return 'Något gick fel. Försök igen.'
}
