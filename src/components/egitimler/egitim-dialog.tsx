"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Egitim } from "@/lib/types";
import { EGITIM_DURUMLARI, DEVAM_EDEN_ILISKILER } from "@/lib/constants";
import { addEgitim, updateEgitim } from "@/lib/egitimler";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  egitim?: Egitim | null;
  defaultKurum?: string;
}

export function EgitimDialog({ open, onOpenChange, egitim, defaultKurum }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tarih: "",
    saat: "",
    kurum: "",
    egitimKonusu: "",
    egitmen: "",
    egitimDurumu: "",
    katilimciSayisi: "",
    sureSaat: "",
    geriBildirimPuani: "",
    devamEdenIliski: "",
    notlar: "",
  });

  useEffect(() => {
    if (egitim) {
      setFormData({
        tarih: egitim.tarih.toDate().toISOString().split("T")[0],
        saat: egitim.saat || "",
        kurum: egitim.kurum || "",
        egitimKonusu: egitim.egitimKonusu || "",
        egitmen: egitim.egitmen || "",
        egitimDurumu: egitim.egitimDurumu || "Tamamlandı",
        katilimciSayisi: egitim.katilimciSayisi?.toString() || "",
        sureSaat: egitim.sureSaat?.toString() || "",
        geriBildirimPuani: egitim.geriBildirimPuani?.toString() || "",
        devamEdenIliski: egitim.devamEdenIliski || "",
        notlar: egitim.notlar || "",
      });
    } else {
      setFormData({
        tarih: new Date().toISOString().split("T")[0],
        saat: "",
        kurum: defaultKurum || "",
        egitimKonusu: "",
        egitmen: "",
        egitimDurumu: "Planlandı",
        katilimciSayisi: "",
        sureSaat: "",
        geriBildirimPuani: "",
        devamEdenIliski: "",
        notlar: "",
      });
    }
  }, [egitim, open, defaultKurum]);

  const handleSave = async () => {
    if (
      !formData.kurum.trim() ||
      !formData.egitimKonusu.trim() ||
      !formData.tarih ||
      !formData.egitimDurumu
    ) {
      toast.error("Kurum, eğitim konusu, tarih ve durum zorunlu");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const firestorePayload = {
        tarih: Timestamp.fromDate(new Date(formData.tarih)),
        saat: formData.saat || undefined,
        kurum: formData.kurum.trim(),
        egitimKonusu: formData.egitimKonusu.trim(),
        egitmen: formData.egitmen.trim() || undefined,
        egitimDurumu: formData.egitimDurumu,
        katilimciSayisi: formData.katilimciSayisi ? Number(formData.katilimciSayisi) : undefined,
        sureSaat: formData.sureSaat ? Number(formData.sureSaat) : undefined,
        geriBildirimPuani: formData.geriBildirimPuani ? Number(formData.geriBildirimPuani) : undefined,
        devamEdenIliski: formData.devamEdenIliski || undefined,
        notlar: formData.notlar.trim() || undefined,
        createdBy: user.uid,
      };

      const cleanData = Object.fromEntries(
        Object.entries(firestorePayload).filter(([, v]) => v !== undefined)
      ) as Omit<Parameters<typeof addEgitim>[0], "logOlusturanAd">;

      if (egitim) {
        await updateEgitim(egitim.id, cleanData);
        toast.success("Eğitim güncellendi");
      } else {
        await addEgitim({
          ...cleanData,
          logOlusturanAd: user.displayName || undefined,
        });
        toast.success("Eğitim eklendi");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{egitim ? "Eğitimi Düzenle" : "Yeni Eğitim Ekle"}</DialogTitle>
          <DialogDescription>Verilen eğitimin detaylarını girin.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tarih">Tarih *</Label>
            <Input
              id="tarih"
              type="date"
              value={formData.tarih}
              onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="saat">Saat</Label>
            <Input
              id="saat"
              type="time"
              value={formData.saat}
              onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Eğitim Durumu *</Label>
            <Select
              value={formData.egitimDurumu || undefined}
              onValueChange={(v) => setFormData({ ...formData, egitimDurumu: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {EGITIM_DURUMLARI.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="egitmen">Eğitmen</Label>
            <Input
              id="egitmen"
              value={formData.egitmen}
              onChange={(e) => setFormData({ ...formData, egitmen: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="kurum">Kurum *</Label>
            <Input
              id="kurum"
              value={formData.kurum}
              onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="egitimKonusu">Eğitim Konusu *</Label>
            <Input
              id="egitimKonusu"
              value={formData.egitimKonusu}
              onChange={(e) => setFormData({ ...formData, egitimKonusu: e.target.value })}
              placeholder="Örn: Sınav Kaygısı Yönetimi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="katilimci">Katılımcı Sayısı</Label>
            <Input
              id="katilimci"
              type="number"
              min="0"
              value={formData.katilimciSayisi}
              onChange={(e) => setFormData({ ...formData, katilimciSayisi: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sure">Süre (Saat)</Label>
            <Input
              id="sure"
              type="number"
              min="0"
              step="0.5"
              value={formData.sureSaat}
              onChange={(e) => setFormData({ ...formData, sureSaat: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Geri Bildirim (1-5)</Label>
            <Select
              value={formData.geriBildirimPuani || undefined}
              onValueChange={(v) => setFormData({ ...formData, geriBildirimPuani: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {"⭐".repeat(n)} ({n})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Devam Eden İlişki</Label>
            <Select
              value={formData.devamEdenIliski || undefined}
              onValueChange={(v) => setFormData({ ...formData, devamEdenIliski: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {DEVAM_EDEN_ILISKILER.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notlar">Notlar</Label>
            <Textarea
              id="notlar"
              rows={3}
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : egitim ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
