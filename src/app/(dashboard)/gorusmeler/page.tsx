"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export default function GorusmelerPage() {
  const { user, signOutUser } = useAuth();

  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Görüşmeler</h1>
          <p className="text-muted-foreground">Hoş geldin, {user.displayName}</p>
        </div>
        <Button variant="outline" onClick={signOutUser}>
          Çıkış Yap
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        🎉 Giriş başarılı! Tablo Faz 4'te gelecek.
      </div>
    </div>
  );
}
