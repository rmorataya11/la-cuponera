import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function register(email, password, profile) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    await setDoc(doc(db, 'clientes', uid), {
      nombres: profile.nombres,
      apellidos: profile.apellidos,
      telefono: profile.telefono,
      correo: profile.correo,
      direccion: profile.direccion,
      dui: profile.dui,
      fechaRegistro: serverTimestamp(),
    });
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  /**
   * Envía el correo; el enlace redirige a tu sitio (/restablecer-contrasena) con ?mode=resetPassword&oobCode=...
   * (el dominio debe estar en Authentication → Settings → Authorized domains).
   */
  function resetPassword(email) {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/restablecer-contrasena`
        : undefined;
    const actionCodeSettings = url
      ? { url, handleCodeInApp: false }
      : undefined;
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  }

  const validatePasswordResetCode = useCallback((oobCode) => verifyPasswordResetCode(auth, oobCode), []);

  const finalizePasswordReset = useCallback(
    (oobCode, newPassword) => confirmPasswordReset(auth, oobCode, newPassword),
    []
  );

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    resetPassword,
    validatePasswordResetCode,
    finalizePasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
