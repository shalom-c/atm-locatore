const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account already exists for this email address.',
  'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled.',
};

export function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error?.code] || error?.message || 'Something went wrong. Please try again.';
}
