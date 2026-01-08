/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { initializeApp } from "firebase/app";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verify Firebase config is loaded
if (!firebaseConfig.apiKey) {
  console.error("Firebase configuration not loaded. Check .env file.");
} else {
  console.log("Firebase initialized for project:", firebaseConfig.projectId);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      console.log("Attempting login with:", email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", result.user.uid);
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      const errorMsg = getErrorMessage(err.code);
      setError(errorMsg);
      throw err;
    }
  };

  const signup = async (email, password) => {
    setError(null);
    try {
      if (password.length < 6) {
        throw new Error("auth/weak-password");
      }
      console.log("Attempting signup with:", email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signup successful:", result.user.uid);
    } catch (err) {
      console.error("Signup error:", err.code, err.message);
      const errorMsg = getErrorMessage(err.code);
      setError(errorMsg);
      throw err;
    }
  };

  const getErrorMessage = (code) => {
    const errors = {
      "auth/invalid-credential": "Invalid email or password. Please check and try again.",
      "auth/user-not-found": "No account found with this email. Please sign up first.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "This email is already registered. Please sign in.",
      "auth/weak-password": "Password should be at least 6 characters long.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/api-key-not-valid": "Firebase configuration error. Please contact support.",
    };
    return errors[code] || `Authentication error: ${code}`;
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      console.log("Attempting Google sign-in...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful:", result.user.uid);
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);
      const errorMsg = getErrorMessage(err.code);
      setError(errorMsg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { auth };
