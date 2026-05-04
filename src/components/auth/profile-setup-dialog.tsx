"use client";

import { useState, type FormEvent } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onComplete: () => void;
}

export function ProfileSetupDialog({ open, onComplete }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("İsim alanı boş bırakılamaz");
      return;
    }
    if (name.trim().length < 2) {
      toast.error("İsim en az 2 karakter olmalı");
      return;
    }
    if (!auth.currentUser) {
      toast.error("Oturum bulunamadı");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
      });
      await auth.currentUser.reload();
      toast.success(`Hoş geldin, ${name.trim()}!`);
      onComplete();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("İsim kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSave();
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Hoş geldin! 👋</DialogTitle>
          <DialogDescription>
            Devam etmeden önce isminizi öğrenelim. Bu isim sistemde sizi temsil edecek.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Bilal Destici"
              disabled={saving}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Devam et"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
