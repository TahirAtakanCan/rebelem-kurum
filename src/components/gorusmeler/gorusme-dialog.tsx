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
import { Gorusme } from "@/lib/types";
import {
  KURUM_TIPLERI,
  DURUMLAR,
  SATIS_DURUMLARI,
  ONCELIKLER,
  EKIP_UYELERI,
} from "@/lib/constants";
import { addGorusme, updateGorusme } from "@/lib/gorusmeler";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gorusme?: Gorusme | null;  // varsa düzenleme, yoksa yeni
}

export function GorusmeDialog({ open, onOpenChange, gorusme }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    kurum: "",
    kurumTipi: "",
    ilgiliKisi: "",
    konumu: "",
    iletisimNo: "",
    mail: "",
    iletisimeGecen: "",
    araci: "",
    durum: "",
    oncelik: "",
    baslamaTarihi: "",
    sonTemasTarihi: "",
    bitisTarihi: "",
    satisDurumu: "",
    not: "",
  });

  // Düzenleme modunda mevcut verileri yükle
  useEffect(() => {
    if (gorusme) {
      setFormData({
        kurum: gorusme.kurum || "",
        kurumTipi: gorusme.kurumTipi || "",
        ilgiliKisi: gorusme.ilgiliKisi || "",
        konumu: gorusme.konumu || "",
        iletisimNo: gorusme.iletisimNo || "",
        mail: gorusme.mail || "",
        iletisimeGecen: gorusme.iletisimeGecen || "",
        araci: gorusme.araci || "",
        durum: gorusme.durum || "",
        oncelik: gorusme.oncelik || "",
        baslamaTarihi: gorusme.baslamaTarihi
          ? gorusme.baslamaTarihi.toDate().toISOString().split("T")[0]
          : "",
        sonTemasTarihi: gorusme.sonTemasTarihi
          ? gorusme.sonTemasTarihi.toDate().toISOString().split("T")[0]
          : "",
        bitisTarihi: gorusme.bitisTarihi
          ? gorusme.bitisTarihi.toDate().toISOString().split("T")[0]
          : "",
        satisDurumu: gorusme.satisDurumu || "",
        not: gorusme.not || "",
      });
    } else {
      // Yeni eklemede formu sıfırla
      setFormData({
        kurum: "", kurumTipi: "", ilgiliKisi: "", konumu: "",
        iletisimNo: "", mail: "", iletisimeGecen: "", araci: "",
        durum: "", oncelik: "", baslamaTarihi: "", sonTemasTarihi: "",
        bitisTarihi: "", satisDurumu: "", not: "",
      });
    }
  }, [gorusme, open]);

  const handleSave = async () => {
    if (!formData.kurum.trim()) {
      toast.error("Kurum adı zorunlu");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const dataToSave = {
        kurum: formData.kurum.trim(),
        kurumTipi: formData.kurumTipi || undefined,
        ilgiliKisi: formData.ilgiliKisi.trim() || undefined,
        konumu: formData.konumu.trim() || undefined,
        iletisimNo: formData.iletisimNo.trim() || undefined,
        mail: formData.mail.trim() || undefined,
        iletisimeGecen: formData.iletisimeGecen || undefined,
        araci: formData.araci.trim() || undefined,
        durum: formData.durum || undefined,
        oncelik: formData.oncelik || undefined,
        baslamaTarihi: formData.baslamaTarihi
          ? Timestamp.fromDate(new Date(formData.baslamaTarihi))
          : null,
        sonTemasTarihi: formData.sonTemasTarihi
          ? Timestamp.fromDate(new Date(formData.sonTemasTarihi))
          : null,
        bitisTarihi: formData.bitisTarihi
          ? Timestamp.fromDate(new Date(formData.bitisTarihi))
          : null,
        satisDurumu: formData.satisDurumu || undefined,
        not: formData.not.trim() || undefined,
        createdBy: user.uid,
      };

      // Firestore undefined kabul etmez, temizleyelim
      const cleanData = Object.fromEntries(
        Object.entries(dataToSave).filter(([, v]) => v !== undefined)
      ) as Parameters<typeof addGorusme>[0];

      if (gorusme) {
        await updateGorusme(gorusme.id, cleanData);
        toast.success("Görüşme güncellendi");
      } else {
        await addGorusme(cleanData);
        toast.success("Görüşme eklendi");
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {gorusme ? "Görüşmeyi Düzenle" : "Yeni Görüşme Ekle"}
          </DialogTitle>
          <DialogDescription>
            Kurum ve görüşme bilgilerini girin. Sadece kurum adı zorunludur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Kurum */}
          <div className="col-span-2 space-y-2">
            <Label htmlFor="kurum">Kurum Adı *</Label>
            <Input
              id="kurum"
              value={formData.kurum}
              onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
              placeholder="Örn: Çağdaş Eğitim"
            />
          </div>

          {/* Kurum Tipi */}
          <div className="space-y-2">
            <Label>Kurum Tipi</Label>
            <Select
              value={formData.kurumTipi || undefined}
              onValueChange={(v) => setFormData({ ...formData, kurumTipi: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {KURUM_TIPLERI.map((tip) => (
                  <SelectItem key={tip} value={tip}>{tip}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* İlgili Kişi */}
          <div className="space-y-2">
            <Label htmlFor="ilgiliKisi">İlgili Kişi</Label>
            <Input
              id="ilgiliKisi"
              value={formData.ilgiliKisi}
              onChange={(e) => setFormData({ ...formData, ilgiliKisi: e.target.value })}
              placeholder="Örn: Sümeyye Canbolat"
            />
          </div>

          {/* Konumu */}
          <div className="space-y-2">
            <Label htmlFor="konumu">Konumu</Label>
            <Input
              id="konumu"
              value={formData.konumu}
              onChange={(e) => setFormData({ ...formData, konumu: e.target.value })}
              placeholder="Örn: Müdür, Rehberlik"
            />
          </div>

          {/* İletişim Numarası */}
          <div className="space-y-2">
            <Label htmlFor="iletisimNo">İletişim Numarası</Label>
            <Input
              id="iletisimNo"
              value={formData.iletisimNo}
              onChange={(e) => setFormData({ ...formData, iletisimNo: e.target.value })}
              placeholder="0533 123 45 67"
            />
          </div>

          {/* Mail */}
          <div className="space-y-2">
            <Label htmlFor="mail">Mail</Label>
            <Input
              id="mail"
              type="email"
              value={formData.mail}
              onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
              placeholder="ornek@kurum.com"
            />
          </div>

          {/* İletişime Geçen */}
          <div className="space-y-2">
            <Label>İletişime Geçen</Label>
            <Select
              value={formData.iletisimeGecen || undefined}
              onValueChange={(v) => setFormData({ ...formData, iletisimeGecen: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {EKIP_UYELERI.map((isim) => (
                  <SelectItem key={isim} value={isim}>{isim}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aracı */}
          <div className="space-y-2">
            <Label htmlFor="araci">Aracı</Label>
            <Input
              id="araci"
              value={formData.araci}
              onChange={(e) => setFormData({ ...formData, araci: e.target.value })}
              placeholder="Varsa aracı kişi"
            />
          </div>

          {/* Durum */}
          <div className="space-y-2">
            <Label>Durum</Label>
            <Select
              value={formData.durum || undefined}
              onValueChange={(v) => setFormData({ ...formData, durum: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {DURUMLAR.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Öncelik */}
          <div className="space-y-2">
            <Label>Öncelik</Label>
            <Select
              value={formData.oncelik || undefined}
              onValueChange={(v) => setFormData({ ...formData, oncelik: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {ONCELIKLER.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Başlama Tarihi */}
          <div className="space-y-2">
            <Label htmlFor="baslamaTarihi">Başlama Tarihi</Label>
            <Input
              id="baslamaTarihi"
              type="date"
              value={formData.baslamaTarihi}
              onChange={(e) => setFormData({ ...formData, baslamaTarihi: e.target.value })}
            />
          </div>

          {/* Son Temas Tarihi */}
          <div className="space-y-2">
            <Label htmlFor="sonTemasTarihi">Son Temas Tarihi</Label>
            <Input
              id="sonTemasTarihi"
              type="date"
              value={formData.sonTemasTarihi}
              onChange={(e) => setFormData({ ...formData, sonTemasTarihi: e.target.value })}
            />
          </div>

          {/* Bitiş Tarihi */}
          <div className="space-y-2">
            <Label htmlFor="bitisTarihi">Bitiş Tarihi</Label>
            <Input
              id="bitisTarihi"
              type="date"
              value={formData.bitisTarihi}
              onChange={(e) => setFormData({ ...formData, bitisTarihi: e.target.value })}
            />
          </div>

          {/* Satış Durumu */}
          <div className="space-y-2">
            <Label>Satış Durumu</Label>
            <Select
              value={formData.satisDurumu || undefined}
              onValueChange={(v) => setFormData({ ...formData, satisDurumu: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {SATIS_DURUMLARI.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Not */}
          <div className="col-span-2 space-y-2">
            <Label htmlFor="not">Not</Label>
            <Textarea
              id="not"
              rows={3}
              value={formData.not}
              onChange={(e) => setFormData({ ...formData, not: e.target.value })}
              placeholder="Görüşme detayları, notlar..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : gorusme ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
