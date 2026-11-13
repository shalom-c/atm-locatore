import { getAuthErrorMessage } from './authMessages.js';

export { getAuthErrorMessage } from './authMessages.js';

export async function signUp(email, password) {
  try {
    const { auth, createUserWithEmailAndPassword } = await import('./authClient.js');
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signIn(email, password) {
  try {
    const { auth, signInWithEmailAndPassword } = await import('./authClient.js');
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signOut() {
  try {
    const { auth, firebaseSignOut } = await import('./authClient.js');
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}
