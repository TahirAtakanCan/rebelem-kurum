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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Gorusme,
  KurumDurumu,
  KurumKisi,
  KurumTipi,
  SatisDurumu,
} from "@/lib/types";
import {
  KURUM_TIPLERI,
  DURUMLAR,
  SATIS_DURUMLARI,
  ONCELIKLER,
  EKIP_UYELERI,
  KURUM_DURUMLARI,
} from "@/lib/constants";
import { addGorusme, updateGorusme } from "@/lib/gorusmeler";
import {
  buildGorusmeSyncPayload,
  initialKisilerFromGorusme,
  kurumDurumuToSatis,
} from "@/lib/kurum-helpers";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const EMPTY_KT = "__empty_kt__";
const EMPTY_KD = "__empty_kd__";
const EMPTY_ON = "__empty_on__";
const EMPTY_IG = "__empty_ig__";
const EMPTY_DURUM = "__empty_durum__";
const EMPTY_SATIS = "__empty_satis__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gorusme?: Gorusme | null;
}

function effectiveKisiler(rows: KurumKisi[]): KurumKisi[] {
  return rows.filter((k) => k.ad.trim().length > 0);
}

export function GorusmeDialog({ open, onOpenChange, gorusme }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("temel");

  const [ad, setAd] = useState("");
  const [kurumTipi, setKurumTipi] = useState<string>(EMPTY_KT);
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [etiketInput, setEtiketInput] = useState("");
  const [tahminiDeger, setTahminiDeger] = useState("");
  const [kurumDurumu, setKurumDurumu] = useState<string>(EMPTY_KD);
  const [oncelik, setOncelik] = useState<string>(EMPTY_ON);

  const [kisiler, setKisiler] = useState<KurumKisi[]>([]);

  const [webSitesi, setWebSitesi] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const [not, setNot] = useState("");

  const [iletisimeGecen, setIletisimeGecen] = useState(EMPTY_IG);
  const [araci, setAraci] = useState("");
  const [konumu, setKonumu] = useState("");
  const [durumLegacy, setDurumLegacy] = useState(EMPTY_DURUM);
  const [baslamaTarihi, setBaslamaTarihi] = useState("");
  const [sonTemasTarihi, setSonTemasTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [satisLegacy, setSatisLegacy] = useState(EMPTY_SATIS);

  useEffect(() => {
    if (!open) return;
    if (gorusme) {
      setAd(gorusme.ad || gorusme.kurum || "");
      setKurumTipi(gorusme.kurumTipi || EMPTY_KT);
      setSehir(gorusme.sehir || "");
      setIlce(gorusme.ilce || "");
      setEtiketInput((gorusme.etiketler || []).join(", "));
      setTahminiDeger(
        gorusme.tahminiDeger !== undefined ? String(gorusme.tahminiDeger) : ""
      );
      setKurumDurumu(gorusme.kurumDurumu || EMPTY_KD);
      setOncelik(gorusme.oncelik || EMPTY_ON);

      const boot = initialKisilerFromGorusme(gorusme);
      setKisiler(boot.length ? boot : []);

      setWebSitesi(gorusme.webSitesi || "");
      setInstagram(gorusme.instagram || "");
      setFacebook(gorusme.facebook || "");
      setLinkedin(gorusme.linkedin || "");

      setNot(gorusme.not || "");

      setIletisimeGecen(gorusme.iletisimeGecen || EMPTY_IG);
      setAraci(gorusme.araci || "");
      setKonumu(gorusme.konumu || "");
      setDurumLegacy(gorusme.durum || EMPTY_DURUM);
      setBaslamaTarihi(
        gorusme.baslamaTarihi
          ? gorusme.baslamaTarihi.toDate().toISOString().split("T")[0]
          : ""
      );
      setSonTemasTarihi(
        gorusme.sonTemasTarihi
          ? gorusme.sonTemasTarihi.toDate().toISOString().split("T")[0]
          : ""
      );
      setBitisTarihi(
        gorusme.bitisTarihi
          ? gorusme.bitisTarihi.toDate().toISOString().split("T")[0]
          : ""
      );
      setSatisLegacy(gorusme.satisDurumu || EMPTY_SATIS);
    } else {
      setAd("");
      setKurumTipi(EMPTY_KT);
      setSehir("");
      setIlce("");
      setEtiketInput("");
      setTahminiDeger("");
      setKurumDurumu(EMPTY_KD);
      setOncelik(EMPTY_ON);
      setKisiler([]);
      setWebSitesi("");
      setInstagram("");
      setFacebook("");
      setLinkedin("");
      setNot("");
      setIletisimeGecen(EMPTY_IG);
      setAraci("");
      setKonumu("");
      setDurumLegacy(EMPTY_DURUM);
      setBaslamaTarihi("");
      setSonTemasTarihi("");
      setBitisTarihi("");
      setSatisLegacy(EMPTY_SATIS);
    }
    setTab("temel");
  }, [gorusme, open]);

  const addKisiRow = () => {
    setKisiler([...kisiler, { id: crypto.randomUUID(), ad: "" }]);
  };

  const updateKisiRow = (id: string, patch: Partial<KurumKisi>) => {
    setKisiler((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const removeKisiRow = (id: string) => {
    setKisiler((rows) => rows.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    if (!ad.trim()) {
      toast.error("Kurum adı zorunlu");
      return;
    }
    if (!user) return;

    const ek = effectiveKisiler(kisiler);
    if (ek.length === 0) {
      toast.warning("İletişim kişisi eklemedin; eski kişi bilgisi korunur.");
    }

    const tags = etiketInput
      .split(/[,;\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    const tahNum = tahminiDeger.trim()
      ? Number(tahminiDeger.replace(",", "."))
      : undefined;
    const tah =
      tahNum !== undefined && Number.isFinite(tahNum)
        ? Math.round(tahNum)
        : undefined;

    const kd: KurumDurumu | undefined =
      kurumDurumu === EMPTY_KD ? undefined : (kurumDurumu as KurumDurumu);

    const syncBase = buildGorusmeSyncPayload({
      ad: ad.trim(),
      kisiler: ek.length ? ek : undefined,
    });

    const forcedSatis = kurumDurumuToSatis(kd);
    const resolvedSatis: SatisDurumu | undefined = forcedSatis
      ?? (satisLegacy !== EMPTY_SATIS ? (satisLegacy as SatisDurumu) : undefined);

    /* Kisi id’leri — yeni kayıtta uuid garanti */
    const kisilerToStore: KurumKisi[] | undefined = ek.length
      ? ek.map((k) => ({
          ...k,
          id: k.id || crypto.randomUUID(),
        }))
      : undefined;

    const dataToSave: Record<string, unknown> = {
      ...syncBase,
      kurumTipi:
        kurumTipi === EMPTY_KT ? undefined : (kurumTipi as KurumTipi),
      sehir: sehir.trim() || undefined,
      ilce: ilce.trim() || undefined,
      etiketler: tags.length ? tags : undefined,
      tahminiDeger: tah !== undefined ? tah : undefined,
      kurumDurumu: kd,

      ...(kisilerToStore ? { kisiler: kisilerToStore } : {}),

      webSitesi: webSitesi.trim() || undefined,
      instagram: instagram.trim() || undefined,
      facebook: facebook.trim() || undefined,
      linkedin: linkedin.trim() || undefined,

      not: not.trim() || undefined,

      iletisimeGecen: iletisimeGecen === EMPTY_IG ? undefined : iletisimeGecen,
      araci: araci.trim() || undefined,
      konumu: konumu.trim() || undefined,
      durum: durumLegacy === EMPTY_DURUM ? undefined : durumLegacy,

      baslamaTarihi: baslamaTarihi
        ? Timestamp.fromDate(new Date(baslamaTarihi))
        : null,
      sonTemasTarihi: sonTemasTarihi
        ? Timestamp.fromDate(new Date(sonTemasTarihi))
        : null,
      bitisTarihi: bitisTarihi
        ? Timestamp.fromDate(new Date(bitisTarihi))
        : null,

      ...(resolvedSatis ? { satisDurumu: resolvedSatis } : {}),
      oncelik:
        oncelik === EMPTY_ON ? undefined : (oncelik as "Yüksek" | "Orta" | "Düşük"),
    };

    const cleanData = Object.fromEntries(
      Object.entries(dataToSave).filter(([, v]) => v !== undefined)
    ) as Parameters<typeof addGorusme>[0];

    setSaving(true);
    try {
      if (gorusme) {
        await updateGorusme(gorusme.id, cleanData);
        toast.success("Kurum güncellendi");
      } else {
        await addGorusme({
          ...cleanData,
          createdBy: user.uid,
        });
        toast.success("Kurum eklendi");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const kisiWarning = effectiveKisiler(kisiler).length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {gorusme ? "Kurumu Düzenle" : "Yeni Kurum Ekle"}
          </DialogTitle>
          <DialogDescription>
            Kurum kaydı; süreç adımları kurum detay sayfasında işaretlenir.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="temel">Temel Bilgiler</TabsTrigger>
            <TabsTrigger value="kisiler">
              İletişim Kişileri{kisiWarning ? " (!)" : ""}
            </TabsTrigger>
            <TabsTrigger value="online">Online Varlık</TabsTrigger>
            <TabsTrigger value="notlar">Notlar</TabsTrigger>
          </TabsList>

          <TabsContent value="temel" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="kurum-ad">Kurum Adı *</Label>
                <Input
                  id="kurum-ad"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  placeholder="Örn: Çağdaş Eğitim"
                />
              </div>

              <div className="space-y-2">
                <Label>Kurum Tipi</Label>
                <Select value={kurumTipi} onValueChange={setKurumTipi}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_KT}>Belirtilmedi</SelectItem>
                    {KURUM_TIPLERI.map((tip) => (
                      <SelectItem key={tip} value={tip}>
                        {tip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kurum Durumu</Label>
                <Select value={kurumDurumu} onValueChange={setKurumDurumu}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_KD}>Belirtilmedi</SelectItem>
                    {KURUM_DURUMLARI.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sehir">Şehir</Label>
                <Input
                  id="sehir"
                  value={sehir}
                  onChange={(e) => setSehir(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ilce">İlçe</Label>
                <Input
                  id="ilce"
                  value={ilce}
                  onChange={(e) => setIlce(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="etiket">Etiketler (virgülle)</Label>
                <Input
                  id="etiket"
                  value={etiketInput}
                  onChange={(e) => setEtiketInput(e.target.value)}
                  placeholder="Konya Merkez, Özel Okul"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahmin">Tahmini Değer (₺)</Label>
                <Input
                  id="tahmin"
                  inputMode="decimal"
                  value={tahminiDeger}
                  onChange={(e) => setTahminiDeger(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select value={oncelik} onValueChange={setOncelik}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_ON}>Belirtilmedi</SelectItem>
                    {ONCELIKLER.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <details className="rounded-md border bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Ekip ve eski süreç alanları
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>İletişime Geçen</Label>
                  <Select value={iletisimeGecen} onValueChange={setIletisimeGecen}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_IG}>Belirtilmedi</SelectItem>
                      {EKIP_UYELERI.map((isim) => (
                        <SelectItem key={isim} value={isim}>
                          {isim}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="araci">Aracı</Label>
                  <Input
                    id="araci"
                    value={araci}
                    onChange={(e) => setAraci(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="konumu">Konumu (eski alan)</Label>
                  <Input
                    id="konumu"
                    value={konumu}
                    onChange={(e) => setKonumu(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eski süreç durumu</Label>
                  <Select value={durumLegacy} onValueChange={setDurumLegacy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_DURUM}>Belirtilmedi</SelectItem>
                      {DURUMLAR.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Satış (legacy)</Label>
                  <Select value={satisLegacy} onValueChange={setSatisLegacy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_SATIS}>Belirtilmedi</SelectItem>
                      {SATIS_DURUMLARI.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baslama">Başlama Tarihi</Label>
                  <Input
                    id="baslama"
                    type="date"
                    value={baslamaTarihi}
                    onChange={(e) => setBaslamaTarihi(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sonTemas">Son Temas Tarihi</Label>
                  <Input
                    id="sonTemas"
                    type="date"
                    value={sonTemasTarihi}
                    onChange={(e) => setSonTemasTarihi(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bitis">Bitiş Tarihi</Label>
                  <Input
                    id="bitis"
                    type="date"
                    value={bitisTarihi}
                    onChange={(e) => setBitisTarihi(e.target.value)}
                  />
                </div>
              </div>
            </details>
          </TabsContent>

          <TabsContent value="kisiler" className="space-y-4">
            {kisiWarning && (
              <p className="text-sm text-amber-800">
                Henüz geçerli bir kişi yok. Kayıtta eski telefon / isim alanları
                varsa korunur; yeni kayıtlar için kişi eklemen önerilir.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addKisiRow}>
                <Plus className="mr-2 h-4 w-4" />
                Kişi Ekle
              </Button>
            </div>
            <div className="space-y-3">
              {kisiler.map((k) => (
                <Card key={k.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Kişi
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => removeKisiRow(k.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Sil
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Ad *</Label>
                        <Input
                          value={k.ad}
                          onChange={(e) =>
                            updateKisiRow(k.id, { ad: e.target.value })
                          }
                          placeholder="Ad Soyad"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol</Label>
                        <Input
                          value={k.rol || ""}
                          onChange={(e) =>
                            updateKisiRow(k.id, { rol: e.target.value })
                          }
                          placeholder="Müdür, Muhasebe..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          value={k.telefon || ""}
                          onChange={(e) =>
                            updateKisiRow(k.id, { telefon: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-posta</Label>
                        <Input
                          type="email"
                          value={k.email || ""}
                          onChange={(e) =>
                            updateKisiRow(k.id, { email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Notlar</Label>
                        <Textarea
                          rows={2}
                          value={k.notlar || ""}
                          onChange={(e) =>
                            updateKisiRow(k.id, { notlar: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="online" className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="web">Web Sitesi</Label>
              <Input
                id="web"
                value={webSitesi}
                onChange={(e) => setWebSitesi(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ig">Instagram</Label>
              <Input
                id="ig"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@kullanici veya tam URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb">Facebook</Label>
              <Input
                id="fb"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="li">LinkedIn</Label>
              <Input
                id="li"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="notlar">
            <div className="space-y-2">
              <Label htmlFor="not-alan">Genel notlar</Label>
              <Textarea
                id="not-alan"
                rows={6}
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Kurumla ilgili genel notlar..."
              />
            </div>
          </TabsContent>
        </Tabs>

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
