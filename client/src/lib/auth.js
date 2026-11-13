import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase.js';

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

export async function signUp(email, password) {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signIn(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}
