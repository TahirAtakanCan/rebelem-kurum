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
import { Randevu } from "@/lib/types";
import { RANDEVU_TIPLERI, RANDEVU_DURUMLARI } from "@/lib/constants";
import { addRandevu, updateRandevu } from "@/lib/randevular";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  randevu?: Randevu | null;
  defaultKurum?: string;
}

export function RandevuDialog({ open, onOpenChange, randevu, defaultKurum }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tarih: "",
    baslangicSaati: "09:00",
    bitisSaati: "10:00",
    kurum: "",
    ilgiliKisi: "",
    randevuTipi: "",
    konumLink: "",
    durum: "Planlandı",
    notlar: "",
  });

  useEffect(() => {
    if (randevu) {
      setFormData({
        tarih: randevu.tarih.toDate().toISOString().split("T")[0],
        baslangicSaati: randevu.baslangicSaati || "09:00",
        bitisSaati: randevu.bitisSaati || "10:00",
        kurum: randevu.kurum || "",
        ilgiliKisi: randevu.ilgiliKisi || "",
        randevuTipi: randevu.randevuTipi || "",
        konumLink: randevu.konumLink || "",
        durum: randevu.durum || "Planlandı",
        notlar: randevu.notlar || "",
      });
    } else {
      const bugun = new Date().toISOString().split("T")[0];
      setFormData({
        tarih: bugun,
        baslangicSaati: "09:00",
        bitisSaati: "10:00",
        kurum: defaultKurum || "",
        ilgiliKisi: "",
        randevuTipi: "",
        konumLink: "",
        durum: "Planlandı",
        notlar: "",
      });
    }
  }, [randevu, open, defaultKurum]);

  const handleSave = async () => {
    if (!formData.kurum.trim()) {
      toast.error("Kurum adı zorunlu");
      return;
    }
    if (!formData.tarih) {
      toast.error("Tarih zorunlu");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const firestorePayload = {
        tarih: Timestamp.fromDate(new Date(formData.tarih)),
        baslangicSaati: formData.baslangicSaati,
        bitisSaati: formData.bitisSaati,
        kurum: formData.kurum.trim(),
        ilgiliKisi: formData.ilgiliKisi.trim() || undefined,
        randevuTipi: formData.randevuTipi || undefined,
        konumLink: formData.konumLink.trim() || undefined,
        durum: formData.durum || undefined,
        notlar: formData.notlar.trim() || undefined,
        createdBy: user.uid,
      };

      const cleanData = Object.fromEntries(
        Object.entries(firestorePayload).filter(([, v]) => v !== undefined)
      ) as Omit<Parameters<typeof addRandevu>[0], "logOlusturanAd">;

      if (randevu) {
        await updateRandevu(randevu.id, cleanData);
        toast.success("Randevu güncellendi");
      } else {
        await addRandevu({
          ...cleanData,
          logOlusturanAd: user.displayName || undefined,
        });
        toast.success("Randevu eklendi");
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
          <DialogTitle>
            {randevu ? "Randevuyu Düzenle" : "Yeni Randevu Ekle"}
          </DialogTitle>
          <DialogDescription>
            Randevuyu kaydettikten sonra Google Takvim'e tek tıkla ekleyebilirsiniz.
          </DialogDescription>
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
            <Label>Tip</Label>
            <Select
              value={formData.randevuTipi || undefined}
              onValueChange={(v) => setFormData({ ...formData, randevuTipi: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {RANDEVU_TIPLERI.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baslangic">Başlangıç Saati</Label>
            <Input
              id="baslangic"
              type="time"
              value={formData.baslangicSaati}
              onChange={(e) => setFormData({ ...formData, baslangicSaati: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bitis">Bitiş Saati</Label>
            <Input
              id="bitis"
              type="time"
              value={formData.bitisSaati}
              onChange={(e) => setFormData({ ...formData, bitisSaati: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="kurum">Kurum *</Label>
            <Input
              id="kurum"
              value={formData.kurum}
              onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
              placeholder="Örn: Çağdaş Eğitim"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ilgiliKisi">İlgili Kişi</Label>
            <Input
              id="ilgiliKisi"
              value={formData.ilgiliKisi}
              onChange={(e) => setFormData({ ...formData, ilgiliKisi: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Durum</Label>
            <Select
              value={formData.durum}
              onValueChange={(v) => setFormData({ ...formData, durum: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {RANDEVU_DURUMLARI.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="konumLink">Konum / Link</Label>
            <Input
              id="konumLink"
              value={formData.konumLink}
              onChange={(e) => setFormData({ ...formData, konumLink: e.target.value })}
              placeholder="Örn: Bağdat Cad. No:5 veya https://meet.google.com/..."
            />
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
            {saving ? "Kaydediliyor..." : randevu ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
