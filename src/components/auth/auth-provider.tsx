"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ProfileSetupDialog } from "./profile-setup-dialog";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser && !firebaseUser.displayName) {
        setNeedsProfileSetup(true);
      } else {
        setNeedsProfileSetup(false);
      }

      if (!firebaseUser && pathname !== "/login") {
        router.push("/login");
      }
      if (firebaseUser && pathname === "/login") {
        router.push("/gorusmeler");
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const err = error as { code?: string };
      console.error("Google sign-in error:", err.code);
      if (err.code === "auth/popup-blocked") {
        toast.error("Popup engellendi. Email/şifre ile girmeyi deneyin.");
      } else if (err.code === "auth/popup-closed-by-user") {
        // Sessiz, kullanıcı kapattı
      } else {
        toast.error("Google ile giriş yapılamadı");
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const err = error as { code?: string };
      console.error("Email sign-in error:", err.code);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        toast.error("Email veya şifre hatalı");
      } else if (err.code === "auth/user-not-found") {
        toast.error("Bu email ile kayıtlı kullanıcı yok");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Geçersiz email adresi");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Çok fazla deneme. Bir süre sonra tekrar deneyin.");
      } else {
        toast.error("Giriş yapılamadı");
      }
      throw error;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setNeedsProfileSetup(false);
    router.push("/login");
  };

  const handleProfileComplete = () => {
    const current = auth.currentUser;
    setNeedsProfileSetup(false);
    if (current) {
      // reload sonrası aynı referans React'ta güncellenmeyebilir; yeniden abone olmadan UI'ı senkronla
      setUser({ ...current } as User);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithEmail, signOutUser }}
    >
      {children}
      <ProfileSetupDialog
        open={needsProfileSetup && !!user}
        onComplete={handleProfileComplete}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
