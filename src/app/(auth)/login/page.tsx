"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      toast.success("Giriş başarılı");
    } catch {
      // Hata zaten provider'da toast olarak gösterildi
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email ve şifre zorunlu");
      return;
    }
    setLoadingEmail(true);
    try {
      await signInWithEmail(email.trim(), password);
      toast.success("Giriş başarılı");
    } catch {
      // Hata zaten provider'da toast olarak gösterildi
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-900 text-2xl font-bold text-white">
            R
          </div>
          <CardTitle className="text-2xl">ReBelem Rehberlik</CardTitle>
          <CardDescription>Kurum takip sistemine hoş geldiniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Şifre Formu */}
          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@rebelem.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingEmail || loadingGoogle}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingEmail || loadingGoogle}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={loadingEmail || loadingGoogle}
            >
              {loadingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          {/* Ayraç */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">veya</span>
            </div>
          </div>

          {/* Google Butonu */}
          <Button
            onClick={handleGoogle}
            disabled={loadingEmail || loadingGoogle}
            variant="outline"
            className="h-11 w-full"
          >
            {loadingGoogle ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yönlendiriliyor...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google ile Giriş Yap
              </>
            )}
          </Button>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Sadece yetkili ekip üyeleri giriş yapabilir.
            <br />
            Hesabın yoksa yöneticinle iletişime geç.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
