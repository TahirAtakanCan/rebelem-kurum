"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
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

const AUTH_READY_MS = 12_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  /* Firebase yapılandırması yoksa onAuthStateChanged bekleme — sonsuz yükleme olmasın */
  useEffect(() => {
    if (isFirebaseConfigured) return;
    setUser(null);
    setLoading(false);
    toast.error(
      "Firebase ortam değişkenleri eksik. .env.local içinde NEXT_PUBLIC_FIREBASE_* değerlerini kontrol edin."
    );
  }, []);

  /* Tek sefer abone ol: pathname bağımlılığı dinleyiciyi sürekli koparıp takınca yarış oluşturuyordu */
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser && !firebaseUser.displayName) {
        setNeedsProfileSetup(true);
      } else {
        setNeedsProfileSetup(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* Yönlendirme: auth tek abonelik; path değişince burada güncellenir */
  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;
    if (!user && pathname !== "/login") {
      router.push("/login");
    }
    if (user && pathname === "/login") {
      router.push("/gorusmeler");
    }
  }, [user, loading, pathname, router]);

  /* Auth cevabı hiç gelmezse (ağ / engel) sonsuz spinner’ı kır */
  useEffect(() => {
    if (!isFirebaseConfigured || !loading) return;
    const t = window.setTimeout(() => {
      setLoading((still) => {
        if (still) {
          toast.error(
            "Giriş durumu alınamadı. İnternet, reklam engelleyici veya Firebase ayarlarını kontrol edin."
          );
          return false;
        }
        return still;
      });
    }, AUTH_READY_MS);
    return () => window.clearTimeout(t);
  }, [loading]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase yapılandırması eksik.");
      return;
    }
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
    if (!isFirebaseConfigured) {
      toast.error("Firebase yapılandırması eksik.");
      return;
    }
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
