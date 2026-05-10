"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Gorev, Gorusme } from "@/lib/types";
import { GOREV_DURUMLARI, ONCELIKLER, EKIP_UYELERI } from "@/lib/constants";
import { addGorev, updateGorev } from "@/lib/gorevler";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

/** Radix Select forbids SelectItem value=""; use sentinels for “unset” options. */
const ATANAN_YOK_VALUE = "__gorev_atanan_yok__";
const GORUSME_YOK_VALUE = "__gorev_kurum_yok__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gorev?: Gorev | null;
  defaultGorusme?: { id: string; kurum: string };
}

export function GorevDialog({ open, onOpenChange, gorev, defaultGorusme }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [kurumSearch, setKurumSearch] = useState("");
  const [formData, setFormData] = useState({
    baslik: "",
    aciklama: "",
    atananAd: "",
    oncelik: "Orta",
    durum: "Bekliyor",
    gorusmeId: "",
    gorusmeKurum: "",
    sonTarih: "",
  });

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((data) => setGorusmeler(data));
    return () => unsub();
  }, [user]);

  const kullaniciListesi = useMemo(() => {
    const isimler = new Set<string>();
    EKIP_UYELERI.forEach((name) => isimler.add(name));
    gorusmeler.forEach((g) => {
      if (g.createdByName) isimler.add(g.createdByName);
    });
    return Array.from(isimler).sort((a, b) => a.localeCompare(b, "tr"));
  }, [gorusmeler]);

  const kurumListesi = useMemo(() => {
    const s = kurumSearch.trim().toLowerCase();
    const filtered = gorusmeler.filter((g) =>
      !s ? true : g.kurum?.toLowerCase().includes(s)
    );
    return filtered;
  }, [gorusmeler, kurumSearch]);

  useEffect(() => {
    if (gorev) {
      setFormData({
        baslik: gorev.baslik || "",
        aciklama: gorev.aciklama || "",
        atananAd: gorev.atananAd || "",
        oncelik: gorev.oncelik || "Orta",
        durum: gorev.durum || "Bekliyor",
        gorusmeId: gorev.gorusmeId || "",
        gorusmeKurum: gorev.gorusmeKurum || "",
        sonTarih: gorev.sonTarih
          ? gorev.sonTarih.toDate().toISOString().split("T")[0]
          : "",
      });
    } else {
      setFormData({
        baslik: "",
        aciklama: "",
        atananAd: "",
        oncelik: "Orta",
        durum: "Bekliyor",
        gorusmeId: defaultGorusme?.id || "",
        gorusmeKurum: defaultGorusme?.kurum || "",
        sonTarih: "",
      });
    }
  }, [gorev, open, defaultGorusme]);

  const handleSave = async () => {
    if (!formData.baslik.trim()) {
      toast.error("Başlık zorunlu");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const dataToSave = {
        baslik: formData.baslik.trim(),
        aciklama: formData.aciklama.trim() || undefined,
        atananAd: formData.atananAd || undefined,
        oncelik: formData.oncelik,
        durum: formData.durum,
        gorusmeId: formData.gorusmeId || undefined,
        gorusmeKurum: formData.gorusmeKurum || undefined,
        sonTarih: formData.sonTarih
          ? Timestamp.fromDate(new Date(formData.sonTarih))
          : undefined,
      };

      const cleanData = Object.fromEntries(
        Object.entries(dataToSave).filter(([, v]) => v !== undefined)
      ) as Parameters<typeof addGorev>[0];

      if (gorev) {
        await updateGorev(gorev.id, cleanData);
        toast.success("Görev güncellendi");
      } else {
        await addGorev({
          ...cleanData,
          createdBy: user.uid,
          createdByName: user.displayName || undefined,
        });
        toast.success("Görev eklendi");
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
          <DialogTitle>{gorev ? "Görevi Düzenle" : "Yeni Görev Ekle"}</DialogTitle>
          <DialogDescription>
            Görev detaylarını girin. Başlık zorunludur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="baslik">Başlık *</Label>
            <Input
              id="baslik"
              value={formData.baslik}
              onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              placeholder="Örn: Kurum sözleşmesini gönder"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aciklama">Açıklama</Label>
            <Textarea
              id="aciklama"
              rows={3}
              value={formData.aciklama}
              onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Atanan Kişi</Label>
            <Select
              value={formData.atananAd || ATANAN_YOK_VALUE}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  atananAd: v === ATANAN_YOK_VALUE ? "" : v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ATANAN_YOK_VALUE}>Atanmadı</SelectItem>
                {kullaniciListesi.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Öncelik</Label>
            <Select
              value={formData.oncelik}
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
                {GOREV_DURUMLARI.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sonTarih">Son Tarih</Label>
            <Input
              id="sonTarih"
              type="date"
              value={formData.sonTarih}
              onChange={(e) => setFormData({ ...formData, sonTarih: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Kurum Bağlantısı</Label>
            <Input
              value={kurumSearch}
              onChange={(e) => setKurumSearch(e.target.value)}
              placeholder="Kurum ara..."
            />
            <Select
              value={formData.gorusmeId || GORUSME_YOK_VALUE}
              onValueChange={(v) => {
                if (v === GORUSME_YOK_VALUE) {
                  setFormData({
                    ...formData,
                    gorusmeId: "",
                    gorusmeKurum: "",
                  });
                  return;
                }
                const match = gorusmeler.find((g) => g.id === v);
                setFormData({
                  ...formData,
                  gorusmeId: v,
                  gorusmeKurum: match?.kurum || "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kurum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GORUSME_YOK_VALUE}>Bağlantı yok</SelectItem>
                {kurumListesi.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.kurum}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : gorev ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
