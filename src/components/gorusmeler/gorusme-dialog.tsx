"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
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
  KurumMilestone,
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
  getMilestoneLabel,
  mergeMilestones,
} from "@/lib/kurum-helpers";
import { logActivity } from "@/lib/aktivite";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { StringCombobox } from "@/components/gorusmeler/string-combobox";
import { ILLER_ADLARI, getIlcelerForIl } from "@/lib/turkiye-iller";
import {
  formatPhone,
  normalizeSocialForStore,
} from "@/lib/format";
import { findDuplicateKurumCandidate, normalizeText } from "@/lib/search";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

const EMPTY_KT = "__empty_kt__";
const EMPTY_KD = "__empty_kd__";
const EMPTY_ON = "__empty_on__";
const EMPTY_IG = "__empty_ig__";
const EMPTY_DURUM = "__empty_durum__";
const EMPTY_SATIS = "__empty_satis__";

const LS_LAST_CITY = "rebelem_lastSelectedCity";

const ROL_OTHER = "Diğer";
const ROL_QUICK_ROLES = [
  "Müdür",
  "Müdür Yardımcısı",
  "Rehberlik",
  "Genel Koordinatör",
  "Muhasebe",
  "Sahip",
  ROL_OTHER,
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gorusme?: Gorusme | null;
  /** Benzer ada sahip kurum uyarısı (yeni kayıt) için */
  allKurumlar?: Gorusme[];
}

function effectiveKisiler(rows: KurumKisi[]): KurumKisi[] {
  return rows.filter((k) => k.ad.trim().length > 0);
}

function dedupeEtiketler(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const x = t.trim();
    if (!x) continue;
    const k = normalizeText(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function closeAndReset(
  onOpenChange: (o: boolean) => void,
  setters: { setDup: (v: Gorusme | null) => void; setPending: (v: string | null) => void }
) {
  setters.setDup(null);
  setters.setPending(null);
  onOpenChange(false);
}

export function GorusmeDialog({
  open,
  onOpenChange,
  gorusme,
  allKurumlar = [],
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("temel");

  const [ad, setAd] = useState("");
  const [kurumTipi, setKurumTipi] = useState<string>(EMPTY_KT);
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [etiketInput, setEtiketInput] = useState("");
  const [etiketSuggestOpen, setEtiketSuggestOpen] = useState(false);
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

  const [duplicateHit, setDuplicateHit] = useState<Gorusme | null>(null);
  const [pendingNewId, setPendingNewId] = useState<string | null>(null);

  const prevSehirRef = useRef("");

  const ilceOptions = useMemo(
    () => (sehir ? getIlcelerForIl(sehir) : []),
    [sehir]
  );

  const allTagPool = useMemo(() => {
    const s = new Set<string>();
    for (const g of allKurumlar) {
      g.etiketler?.forEach((t) => {
        const x = t.trim();
        if (x) s.add(x);
      });
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "tr"));
  }, [allKurumlar]);

  const { tagToken, tagPrevNorm } = useMemo(() => {
    const lastComma = etiketInput.lastIndexOf(",");
    const leading =
      lastComma >= 0 ? etiketInput.slice(0, lastComma + 1) : "";
    const tail =
      lastComma >= 0 ? etiketInput.slice(lastComma + 1) : etiketInput;
    const token = tail.trim();
    const prev = leading
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const prevNorm = new Set(prev.map((t) => normalizeText(t)));
    return { tagToken: token, tagPrevNorm: prevNorm };
  }, [etiketInput]);

  const tagSuggestions = useMemo(() => {
    const nq = normalizeText(tagToken);
    return allTagPool
      .filter((t) => !tagPrevNorm.has(normalizeText(t)))
      .filter((t) => !nq || normalizeText(t).includes(nq))
      .slice(0, 12);
  }, [allTagPool, tagToken, tagPrevNorm]);

  const applyEtiketPick = useCallback(
    (tag: string) => {
      const lastComma = etiketInput.lastIndexOf(",");
      const leading =
        lastComma >= 0 ? etiketInput.slice(0, lastComma) : "";
      const parts = leading
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const next = [...parts, tag].join(", ");
      setEtiketInput(`${next}, `);
    },
    [etiketInput]
  );

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
      prevSehirRef.current = gorusme.sehir || "";
    } else {
      setAd("");
      setKurumTipi(EMPTY_KT);
      let lastCity = "";
      try {
        lastCity =
          typeof window !== "undefined"
            ? localStorage.getItem(LS_LAST_CITY) || ""
            : "";
      } catch {
        lastCity = "";
      }
      setSehir(lastCity && ILLER_ADLARI.includes(lastCity) ? lastCity : "");
      setIlce("");
      setEtiketInput("");
      setTahminiDeger("");
      setKurumDurumu(EMPTY_KD);
      setOncelik(EMPTY_ON);
      setKisiler([{ id: crypto.randomUUID(), ad: "" }]);
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
      prevSehirRef.current =
        lastCity && ILLER_ADLARI.includes(lastCity) ? lastCity : "";
    }
    setDuplicateHit(null);
    setPendingNewId(null);
    setTab("temel");
  }, [gorusme, open]);

  useEffect(() => {
    if (!open || gorusme) return;
    const s = sehir.trim();
    if (s && ILLER_ADLARI.includes(s)) {
      try {
        localStorage.setItem(LS_LAST_CITY, s);
      } catch {
        /* ignore */
      }
    }
  }, [open, gorusme, sehir]);

  useEffect(() => {
    const prev = prevSehirRef.current;
    if (prev === sehir) return;
    prevSehirRef.current = sehir;
    const list = getIlcelerForIl(sehir);
    setIlce((cur) =>
      cur && list.length && !list.includes(cur) ? "" : cur
    );
  }, [sehir]);

  useEffect(() => {
    const show =
      etiketSuggestOpen && tagSuggestions.length > 0 && open;
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEtiketSuggestOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [etiketSuggestOpen, tagSuggestions.length, open]);

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

  const runSave = async (opts: { skipDuplicateCheck: boolean }) => {
    if (!ad.trim()) {
      toast.error("Kurum adı zorunlu");
      return;
    }
    if (!user) return;

    if (
      !gorusme &&
      !opts.skipDuplicateCheck &&
      allKurumlar.length > 0
    ) {
      const hit = findDuplicateKurumCandidate(ad.trim(), allKurumlar);
      if (hit) {
        setDuplicateHit(hit);
        return;
      }
    }

    const ek = effectiveKisiler(kisiler);
    if (ek.length === 0) {
      toast.warning("İletişim kişisi eklemedin; eski kişi bilgisi korunur.");
    }

    const tags = dedupeEtiketler(
      etiketInput
        .split(/[,;\n]/g)
        .map((s) => s.trim())
        .filter(Boolean)
    );

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
      ? forcedSatis
      : satisLegacy !== EMPTY_SATIS
        ? (satisLegacy as SatisDurumu)
        : undefined;

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
      instagram: normalizeSocialForStore(instagram, "instagram") || undefined,
      facebook: normalizeSocialForStore(facebook, "facebook") || undefined,
      linkedin: normalizeSocialForStore(linkedin, "linkedin") || undefined,

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
        oncelik === EMPTY_ON
          ? undefined
          : (oncelik as "Yüksek" | "Orta" | "Düşük"),
    };

    const cleanData = Object.fromEntries(
      Object.entries(dataToSave).filter(([, v]) => v !== undefined)
    ) as Parameters<typeof addGorusme>[0];

    setSaving(true);
    try {
      if (gorusme) {
        const oncekiKd = gorusme.kurumDurumu;
        await updateGorusme(gorusme.id, cleanData);
        const yeniKd = cleanData.kurumDurumu;
        if (yeniKd && yeniKd !== oncekiKd) {
          void logActivity({
            tip: "kurum_durumu",
            mesaj: `${user.displayName || "Takım"} "${ad.trim()}" kurumunu “${yeniKd}” durumuna aldı`,
            kullaniciId: user.uid,
            kullaniciAd: user.displayName || undefined,
            ilgiliId: gorusme.id,
          });
        }
        toast.success("Kurum güncellendi");
        closeAndReset(onOpenChange, {
          setDup: setDuplicateHit,
          setPending: setPendingNewId,
        });
      } else {
        const ref = await addGorusme({
          ...cleanData,
          createdBy: user.uid,
        });
        toast.success("Kurum eklendi");
        setPendingNewId(ref.id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const applyIlkIletisim = async (yes: boolean) => {
    if (!pendingNewId || !user) return;
    if (!yes) {
      closeAndReset(onOpenChange, {
        setDup: setDuplicateHit,
        setPending: setPendingNewId,
      });
      return;
    }
    setSaving(true);
    try {
      const base = mergeMilestones(undefined);
      const milestones: KurumMilestone[] = base.map((m) =>
        m.tip === "ilk_iletisim"
          ? {
              ...m,
              tamamlandi: true,
              tamamlanmaTarihi: Timestamp.now(),
              tamamlayanUid: user.uid,
              tamamlayanAd: user.displayName || undefined,
            }
          : m
      );
      await updateGorusme(pendingNewId, { milestones });
      void logActivity({
        tip: "milestone",
        mesaj: `${user.displayName || "Takım"} "${ad.trim()}" kurumunda “${getMilestoneLabel("ilk_iletisim")}” adımını işaretledi`,
        kullaniciId: user.uid,
        kullaniciAd: user.displayName || undefined,
        ilgiliId: pendingNewId,
      });
      toast.success("İlk iletişim kaydedildi");
      closeAndReset(onOpenChange, {
        setDup: setDuplicateHit,
        setPending: setPendingNewId,
      });
    } catch (e) {
      console.error(e);
      toast.error("Milestone güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const kisiWarning = effectiveKisiler(kisiler).length === 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setEtiketSuggestOpen(false);
          if (!next && pendingNewId && !saving) {
            void applyIlkIletisim(false);
            return;
          }
          onOpenChange(next);
        }}
      >
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

                <StringCombobox
                  id="sehir-cb"
                  label="Şehir (İl)"
                  value={sehir}
                  onChange={setSehir}
                  options={ILLER_ADLARI}
                  allowCustom={false}
                  placeholder="İl seç veya ara"
                  disabled={saving || Boolean(pendingNewId)}
                />

                <StringCombobox
                  id="ilce-cb"
                  label="İlçe"
                  value={ilce}
                  onChange={setIlce}
                  options={ilceOptions}
                  allowCustom
                  placeholder={
                    sehir ? "İlçe ara veya yaz" : "Önce şehir seçin"
                  }
                  disabled={saving || Boolean(pendingNewId) || !sehir}
                />
                <p className="text-xs text-muted-foreground md:col-span-2">
                  Son seçtiğiniz il bu tarayıcıda hatırlanır.
                </p>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="etiket">Etiketler</Label>
                  <Popover
                    open={
                      etiketSuggestOpen &&
                      tagSuggestions.length > 0 &&
                      Boolean(open)
                    }
                    onOpenChange={setEtiketSuggestOpen}
                  >
                    <PopoverAnchor asChild>
                      <Input
                        id="etiket"
                        value={etiketInput}
                        onChange={(e) => {
                          setEtiketInput(e.target.value);
                          setEtiketSuggestOpen(true);
                        }}
                        onFocus={() =>
                          tagSuggestions.length > 0 &&
                          setEtiketSuggestOpen(true)
                        }
                        placeholder="Önerilerden seçin veya virgülle ayırın"
                        disabled={Boolean(pendingNewId)}
                      />
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-[min(100vw-2rem,var(--radix-popover-anchor-width,20rem))] p-0"
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <ul className="max-h-48 overflow-y-auto p-1">
                        {tagSuggestions.map((tag) => (
                          <li key={tag}>
                            <button
                              type="button"
                              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                applyEtiketPick(tag);
                                setEtiketSuggestOpen(false);
                              }}
                            >
                              {tag}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tahmin">Tahmini Değer (₺)</Label>
                  <Input
                    id="tahmin"
                    inputMode="decimal"
                    value={tahminiDeger}
                    onChange={(e) => setTahminiDeger(e.target.value)}
                    disabled={Boolean(pendingNewId)}
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
                    <Select
                      value={iletisimeGecen}
                      onValueChange={setIletisimeGecen}
                    >
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKisiRow}
                  disabled={Boolean(pendingNewId)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Kişi Ekle
                </Button>
              </div>
              <div className="space-y-3">
                {kisiler.map((k) => {
                  const presetKeys = new Set<string>(
                    ROL_QUICK_ROLES.slice(0, -1).map((x) => x as string)
                  );
                  const hasPreset = !!(k.rol && presetKeys.has(k.rol));
                  const selectRol =
                    hasPreset ? (k.rol as string) : ROL_OTHER;
                  return (
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
                            disabled={Boolean(pendingNewId)}
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
                              disabled={Boolean(pendingNewId)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rol</Label>
                            <Select
                              value={selectRol}
                              onValueChange={(v) => {
                                if (v === ROL_OTHER) {
                                  updateKisiRow(k.id, {
                                    rol: hasPreset ? "" : k.rol || "",
                                  });
                                } else {
                                  updateKisiRow(k.id, { rol: v });
                                }
                              }}
                              disabled={Boolean(pendingNewId)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROL_QUICK_ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectRol === ROL_OTHER && (
                              <Input
                                className="mt-1"
                                value={k.rol && !hasPreset ? k.rol : ""}
                                onChange={(e) =>
                                  updateKisiRow(k.id, {
                                    rol: e.target.value,
                                  })
                                }
                                placeholder="Rolü yazın"
                                disabled={Boolean(pendingNewId)}
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input
                              value={k.telefon || ""}
                              onChange={(e) =>
                                updateKisiRow(k.id, {
                                  telefon: formatPhone(e.target.value),
                                })
                              }
                              inputMode="tel"
                              disabled={Boolean(pendingNewId)}
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
                              disabled={Boolean(pendingNewId)}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Notlar</Label>
                            <Textarea
                              rows={2}
                              value={k.notlar || ""}
                              onChange={(e) =>
                                updateKisiRow(k.id, {
                                  notlar: e.target.value,
                                })
                              }
                              disabled={Boolean(pendingNewId)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                  disabled={Boolean(pendingNewId)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">Instagram</Label>
                <Input
                  id="ig"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@kullanici veya tam URL"
                  disabled={Boolean(pendingNewId)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb">Facebook</Label>
                <Input
                  id="fb"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  disabled={Boolean(pendingNewId)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="li">LinkedIn</Label>
                <Input
                  id="li"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  disabled={Boolean(pendingNewId)}
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
                  disabled={Boolean(pendingNewId)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                pendingNewId
                  ? void applyIlkIletisim(false)
                  : onOpenChange(false)
              }
              disabled={saving}
            >
              İptal
            </Button>
            <Button
              onClick={() => void runSave({ skipDuplicateCheck: false })}
              disabled={saving || Boolean(pendingNewId)}
            >
              {saving ? "Kaydediliyor..." : gorusme ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={duplicateHit !== null}
        onOpenChange={(v) => {
          if (!v) setDuplicateHit(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Benzer kurum var</DialogTitle>
            <DialogDescription className="text-left">
              {duplicateHit
                ? `"${duplicateHit.ad || duplicateHit.kurum || ""}" adına çok yakın bir kayıt${duplicateHit.sehir ? ` (${duplicateHit.sehir})` : ""} var. Mevcut kayda gitmek ister misiniz?`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const hit = duplicateHit;
                setDuplicateHit(null);
                router.push(hit ? `/kurumlar/${hit.id}` : "/gorusmeler");
              }}
            >
              Evet, Git
            </Button>
            <Button
              onClick={() => {
                setDuplicateHit(null);
                void runSave({ skipDuplicateCheck: true });
              }}
            >
              Hayır, yine de kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingNewId !== null && !duplicateHit}
        onOpenChange={(v) => {
          if (!v && pendingNewId) {
            void applyIlkIletisim(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>İlk iletişim</DialogTitle>
            <DialogDescription>
              Bu kurumla ilk iletişim kuruldu mu? Evet diyerek süreçte
              &quot;İlk iletişim&quot; adımını işaretlersiniz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => void applyIlkIletisim(false)}
              disabled={saving}
            >
              Hayır
            </Button>
            <Button onClick={() => void applyIlkIletisim(true)} disabled={saving}>
              Evet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
