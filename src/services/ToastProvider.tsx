import { toast, Toaster } from 'solid-toast';
import { createEffect } from 'solid-js';


// --- Hash et Auth ---
export async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function setStoredPassword(password: string) {
  const hash = await hashPassword(password);
  localStorage.setItem('MEALTICKET_PASSWORD_HASH', hash);
}

export async function authenticate(usernameInput: string, passwordInput: string) {
  const storedUsername = import.meta.env.VITE_MEALTICKET_USER;
  const storedHash = localStorage.getItem('MEALTICKET_PASSWORD_HASH');
  const inputHash = await hashPassword(passwordInput);

  if (usernameInput === storedUsername && inputHash === storedHash) {
    toast.success('Authentification réussie !');
    return true;
  } else {
    toast.error('Identifiants incorrects.');
    return false;
  }
}

// --- Initialisation côté client ---
createEffect(() => {
  if (!localStorage.getItem('MEALTICKET_PASSWORD_HASH')) {
    setStoredPassword(import.meta.env.VITE_MEALTICKET_PASSWORD);
  }
});

// --- Composant Toaster à inclure dans App.tsx ou Layout.tsx ---
export function ToastProvider() {
  return <Toaster position="top-center" />;
}
