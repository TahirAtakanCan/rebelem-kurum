"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow, isPast, isThisWeek, isToday } from "date-fns";
import { tr } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Gorusme,
  Randevu,
  Egitim,
  KurumNotu,
  EgitimDurumu,
  Gorev,
  GorevDurumu,
  MilestoneTipi,
  KurumMilestone,
} from "@/lib/types";
import { subscribeRandevular } from "@/lib/randevular";
import { subscribeEgitimler } from "@/lib/egitimler";
import { subscribeGorusmeler, updateGorusme } from "@/lib/gorusmeler";
import { deleteGorev, subscribeGorevler, toggleGorevDurum } from "@/lib/gorevler";
import {
  addKurumNotu,
  deleteKurumNotu,
  subscribeKurumNotlari,
  updateKurumNotu,
} from "@/lib/kurum-notlari";
import {
  DURUM_RENKLERI,
  EGITIM_DURUM_RENKLERI,
  GOREV_DURUM_RENKLERI,
  ILISKI_RENKLERI,
  KURUM_TIPI_RENKLERI,
  KURUM_DURUM_RENKLERI,
  MILESTONE_TIPLERI,
  ONCELIK_RENKLERI,
  RANDEVU_DURUM_RENKLERI,
  SATIS_RENKLERI,
} from "@/lib/constants";
import {
  getKurumDisplayName,
  getMilestoneLabel,
  getResolvedKurumDurumu,
  mergeMilestones,
  milestoneCompletionPercent,
  applyMilestoneToggle,
  milestonesArrayForFirestore,
} from "@/lib/kurum-helpers";
import { logActivity } from "@/lib/aktivite";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { socialHref } from "@/lib/format";
import { GorusmeDialog } from "@/components/gorusmeler/gorusme-dialog";
import { RandevuDialog } from "@/components/randevular/randevu-dialog";
import { EgitimDialog } from "@/components/egitimler/egitim-dialog";
import { GorevDialog } from "@/components/gorevler/gorev-dialog";
import { ArrowLeft, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

const gorevDurumlari: GorevDurumu[] = ["Bekliyor", "Yapılıyor", "Tamamlandı"];

export default function KurumDetayPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const gorusmeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [gorusme, setGorusme] = useState<Gorusme | null>(null);
  const [loadingGorusme, setLoadingGorusme] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loadingRandevular, setLoadingRandevular] = useState(true);

  const [egitimler, setEgitimler] = useState<Egitim[]>([]);
  const [loadingEgitimler, setLoadingEgitimler] = useState(true);

  const [notlar, setNotlar] = useState<KurumNotu[]>([]);
  const [loadingNotlar, setLoadingNotlar] = useState(true);
  const [notFormOpen, setNotFormOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ baslik: "", icerik: "" });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteForm, setEditNoteForm] = useState({ baslik: "", icerik: "" });

  const [gorusmeDialogOpen, setGorusmeDialogOpen] = useState(false);
  const [randevuDialogOpen, setRandevuDialogOpen] = useState(false);
  const [egitimDialogOpen, setEgitimDialogOpen] = useState(false);
  const [gorevDialogOpen, setGorevDialogOpen] = useState(false);
  const [editingGorev, setEditingGorev] = useState<Gorev | null>(null);

  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [loadingGorevler, setLoadingGorevler] = useState(true);

  const [allGorusmelerForDup, setAllGorusmelerForDup] = useState<Gorusme[]>(
    []
  );

  const [milestoneNoteOpen, setMilestoneNoteOpen] = useState(false);
  const [milestoneNoteTip, setMilestoneNoteTip] = useState<MilestoneTipi | null>(null);
  const [milestoneNoteDraft, setMilestoneNoteDraft] = useState("");
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneToggleBusy, setMilestoneToggleBusy] = useState(false);
  const [kurumDetayTab, setKurumDetayTab] = useState("bilgiler");

  const loadGorusme = useCallback(async (options?: { silent?: boolean }) => {
    if (!gorusmeId) return;
    const silent = options?.silent === true;
    if (!silent) setLoadingGorusme(true);
    try {
      const snapshot = await getDoc(doc(db, "gorusmeler", gorusmeId));
      if (!snapshot.exists()) {
        setNotFound(true);
        setGorusme(null);
      } else {
        setNotFound(false);
        setGorusme({ id: snapshot.id, ...(snapshot.data() as Omit<Gorusme, "id">) });
      }
    } catch {
      setNotFound(true);
      setGorusme(null);
    } finally {
      if (!silent) setLoadingGorusme(false);
    }
  }, [gorusmeId]);

  useEffect(() => {
    if (!user || !gorusmeId) return;
    loadGorusme();
  }, [gorusmeId, user, loadGorusme]);

  useEffect(() => {
    setKurumDetayTab("bilgiler");
  }, [gorusmeId]);

  useEffect(() => {
    if (!user) return;
    setLoadingRandevular(true);
    const unsub = subscribeRandevular((data) => {
      setRandevular(data);
      setLoadingRandevular(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingEgitimler(true);
    const unsub = subscribeEgitimler((data) => {
      setEgitimler(data);
      setLoadingEgitimler(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !gorusmeId) return;
    setLoadingNotlar(true);
    const unsub = subscribeKurumNotlari(gorusmeId, (data) => {
      setNotlar(data);
      setLoadingNotlar(false);
    });
    return () => unsub();
  }, [gorusmeId, user]);

  useEffect(() => {
    if (!user) return;
    setLoadingGorevler(true);
    const unsub = subscribeGorevler((data) => {
      setGorevler(data);
      setLoadingGorevler(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((data) => setAllGorusmelerForDup(data));
    return () => unsub();
  }, [user]);

  const kurumAdi = gorusme ? getKurumDisplayName(gorusme) : "";

  const kurumRandevular = useMemo(() => {
    if (!kurumAdi) return [];
    return randevular.filter((r) => r.kurum === kurumAdi);
  }, [kurumAdi, randevular]);

  const kurumEgitimler = useMemo(() => {
    if (!kurumAdi) return [];
    return egitimler.filter((e) => e.kurum === kurumAdi);
  }, [kurumAdi, egitimler]);

  const kurumGorevler = useMemo(() => {
    if (!gorusmeId) return [];
    return gorevler.filter((g) => g.gorusmeId === gorusmeId);
  }, [gorevler, gorusmeId]);

  const getDurum = (e: Egitim): EgitimDurumu => e.egitimDurumu || "Tamamlandı";

  const formatDate = (ts: Gorusme["baslamaTarihi"]) => {
    if (!ts) return "-";
    return format(ts.toDate(), "dd.MM.yyyy", { locale: tr });
  };

  const noteMeta = (note: KurumNotu) => {
    if (!note.createdAt) return note.createdByName || "";
    const timeText = formatDistanceToNow(note.createdAt.toDate(), {
      addSuffix: true,
      locale: tr,
    });
    return `${timeText}${note.createdByName ? `, ${note.createdByName}` : ""}`;
  };

  const canEditNote = (note: KurumNotu) => note.createdBy === user?.uid;

  const handleAddNote = async () => {
    if (!noteForm.icerik.trim() || !user || !gorusmeId) return;
    setSavingNote(true);
    try {
      await addKurumNotu({
        gorusmeId,
        baslik: noteForm.baslik.trim() || undefined,
        icerik: noteForm.icerik.trim(),
        createdBy: user.uid,
        createdByName: user.displayName || undefined,
      });
      setNoteForm({ baslik: "", icerik: "" });
      setNotFormOpen(false);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNote = (note: KurumNotu) => {
    setEditingNoteId(note.id);
    setEditNoteForm({ baslik: note.baslik || "", icerik: note.icerik || "" });
  };

  const handleUpdateNote = async (note: KurumNotu) => {
    if (!editNoteForm.icerik.trim()) return;
    await updateKurumNotu(note.id, {
      baslik: editNoteForm.baslik.trim() || undefined,
      icerik: editNoteForm.icerik.trim(),
    });
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (note: KurumNotu) => {
    if (!confirm("Notu silmek istediğinden emin misin?")) return;
    await deleteKurumNotu(note.id);
  };

  const handleDeleteGorev = async (g: Gorev) => {
    if (!confirm(`"${g.baslik}" görevini silmek istediğinden emin misin?`)) return;
    await deleteGorev(g.id);
  };

  const handleEditGorev = (g: Gorev) => {
    setEditingGorev(g);
    setGorevDialogOpen(true);
  };

  const getRandevuCardClass = (r: Randevu) => {
    const date = r.tarih.toDate();
    if (isToday(date)) return "border-yellow-200 bg-yellow-50";
    if (isPast(date) && r.durum !== "Tamamlandı" && r.durum !== "İptal")
      return "opacity-90";
    if (isThisWeek(date, { weekStartsOn: 1 })) return "border-blue-200 bg-blue-50/50";
    return "";
  };

  const persistMilestones = async (next: KurumMilestone[]) => {
    if (!gorusmeId) return;
    const cleaned = milestonesArrayForFirestore(next);
    await updateGorusme(gorusmeId, { milestones: cleaned });
    await loadGorusme({ silent: true });
  };

  const handleMilestoneToggle = async (tip: MilestoneTipi, tamamlandi: boolean) => {
    if (!gorusme || !user) return;
    const merged = mergeMilestones(gorusme.milestones);
    const onceki = merged.find((m) => m.tip === tip);
    const ilkKezTamam = tamamlandi && !onceki?.tamamlandi;
    const now = Timestamp.fromDate(new Date());
    const next = applyMilestoneToggle(merged, tip, tamamlandi, now, user);
    setMilestoneToggleBusy(true);
    try {
      await persistMilestones(next);
      if (ilkKezTamam) {
        const ad = user.displayName || "Takım";
        void logActivity({
          tip: "milestone",
          mesaj: `${ad} ${getKurumDisplayName(gorusme)} kurumunda “${getMilestoneLabel(tip)}” adımını tamamladı`,
          kullaniciId: user.uid,
          kullaniciAd: user.displayName || undefined,
          ilgiliId: gorusme.id,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Milestone güncellenemedi. Bağlantınızı kontrol edin.");
    } finally {
      setMilestoneToggleBusy(false);
    }
  };

  const handleSaveMilestoneNote = async () => {
    if (!gorusme || !milestoneNoteTip) return;
    setSavingMilestone(true);
    try {
      const merged = mergeMilestones(gorusme.milestones);
      const next = merged.map((m) =>
        m.tip === milestoneNoteTip ? { ...m, not: milestoneNoteDraft.trim() || undefined } : m
      );
      await persistMilestones(next);
      setMilestoneNoteOpen(false);
    } finally {
      setSavingMilestone(false);
    }
  };

  const milestonesMerged = useMemo(
    () => (gorusme ? mergeMilestones(gorusme.milestones) : []),
    [gorusme]
  );

  if (loading || loadingGorusme) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return null;

  if (notFound || !gorusme) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="text-lg font-semibold">Kurum bulunamadı</div>
          <div className="text-sm text-muted-foreground">
            Aradığınız kurum kaydı bulunamadı.
          </div>
          <Button onClick={() => router.push("/gorusmeler")}>Kurumlara Dön</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => router.push("/gorusmeler")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">{getKurumDisplayName(gorusme)}</h1>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <Button onClick={() => setGorusmeDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Card size="sm" className="w-full sm:w-72">
            <CardContent className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Kullanım Kılavuzu
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Sekmelerde kurumun tüm kayıtları görünür.</li>
                <li>Notları sadece yazan kişi düzenleyebilir.</li>
                <li>Yeni randevu/eğitim/görev butonları kurumu doldurur.</li>
                <li>Üst rozetler kurumun güncel durumunu özetler.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={KURUM_DURUM_RENKLERI[getResolvedKurumDurumu(gorusme)]}>
          {getResolvedKurumDurumu(gorusme)}
        </Badge>
        {gorusme.kurumTipi && (
          <Badge variant="outline" className={KURUM_TIPI_RENKLERI[gorusme.kurumTipi]}>
            {gorusme.kurumTipi}
          </Badge>
        )}
        {gorusme.durum && (
          <Badge variant="outline" className={DURUM_RENKLERI[gorusme.durum]}>
            Eski süreç: {gorusme.durum}
          </Badge>
        )}
        {gorusme.oncelik && (
          <Badge variant="outline" className={ONCELIK_RENKLERI[gorusme.oncelik]}>
            {gorusme.oncelik}
          </Badge>
        )}
        {!gorusme.kurumDurumu && gorusme.satisDurumu && (
          <Badge variant="outline" className={SATIS_RENKLERI[gorusme.satisDurumu]}>
            Legacy satış: {gorusme.satisDurumu}
          </Badge>
        )}
      </div>

      <Tabs
        value={kurumDetayTab}
        onValueChange={setKurumDetayTab}
        className="gap-6"
      >
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
            <TabsTrigger value="surec">Süreç</TabsTrigger>
            <TabsTrigger value="notlar">Notlar & Zaman Çizelgesi</TabsTrigger>
            <TabsTrigger value="randevular">Randevular</TabsTrigger>
            <TabsTrigger value="egitimler">Eğitimler</TabsTrigger>
            <TabsTrigger value="gorevler">Görevler</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bilgiler">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kurum özeti</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <InfoItem label="Şehir" value={gorusme.sehir || "-"} />
                <InfoItem label="İlçe" value={gorusme.ilce || "-"} />
                <InfoItem
                  label="Tahmini Değer"
                  value={
                    gorusme.tahminiDeger != null
                      ? `${gorusme.tahminiDeger.toLocaleString("tr-TR")} ₺`
                      : "-"
                  }
                />
                <InfoItem
                  label="Etiketler"
                  value={(gorusme.etiketler || []).length ? (gorusme.etiketler || []).join(", ") : "-"}
                  full
                />
              </CardContent>
            </Card>

            {(gorusme.kisiler?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Kişiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gorusme.kisiler?.map((k) => (
                    <div key={k.id} className="rounded-md border p-4 text-sm">
                      <div className="font-semibold">{k.ad || "(İsimsiz)"}</div>
                      <div className="mt-1 space-y-0.5 text-muted-foreground">
                        {k.rol && <div>Rol: {k.rol}</div>}
                        {k.telefon && <div>Tel: {k.telefon}</div>}
                        {k.email && <div>E-posta: {k.email}</div>}
                        {k.notlar && <div className="whitespace-pre-wrap pt-2">{k.notlar}</div>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Online varlık</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <LinkMaybe label="Web" href={gorusme.webSitesi} />
                <LinkMaybe label="Instagram" href={gorusme.instagram} social="instagram" />
                <LinkMaybe label="Facebook" href={gorusme.facebook} social="facebook" />
                <LinkMaybe label="LinkedIn" href={gorusme.linkedin} social="linkedin" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ek bilgiler (legacy ve süreç)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <InfoItem label="İlk kişi (legacy)" value={gorusme.ilgiliKisi || "-"} />
                <InfoItem label="Konumu" value={gorusme.konumu || "-"} />
                <InfoItem label="Telefon (legacy)" value={gorusme.iletisimNo || "-"} />
                <InfoItem label="Mail (legacy)" value={gorusme.mail || "-"} />
                <InfoItem label="İletişime Geçen" value={gorusme.iletisimeGecen || "-"} />
                <InfoItem label="Aracı" value={gorusme.araci || "-"} />
                <InfoItem label="Başlama Tarihi" value={formatDate(gorusme.baslamaTarihi)} />
                <InfoItem label="Son Temas" value={formatDate(gorusme.sonTemasTarihi)} />
                <InfoItem label="Bitiş Tarihi" value={formatDate(gorusme.bitisTarihi)} />
                <InfoItem label="Genel Not" value={gorusme.not || "-"} full />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surec" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Satış süreci — milestone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span>
                    İlerleme: {milestonesMerged.filter((x) => x.tamamlandi).length}/
                    {MILESTONE_TIPLERI.length}
                  </span>
                  <span className="text-muted-foreground">
                    %{milestoneCompletionPercent(gorusme.milestones)} tamamlandı
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{
                      width: `${milestoneCompletionPercent(gorusme.milestones)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {MILESTONE_TIPLERI.map((def) => {
                  const m = milestonesMerged.find((x) => x.tip === def.tip);
                  const tam = m?.tamamlandi ?? false;
                  return (
                    <div
                      key={def.tip}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        tam ? "border-green-200 bg-green-50/60" : "bg-muted/20"
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-green-600"
                          checked={tam}
                          disabled={milestoneToggleBusy || savingMilestone}
                          onChange={(e) =>
                            handleMilestoneToggle(def.tip, e.target.checked)
                          }
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="font-medium">{def.label}</div>
                          <div className="text-sm text-muted-foreground">{def.aciklama}</div>
                          {tam && m?.tamamlanmaTarihi && (
                            <div className="text-xs text-muted-foreground">
                              Tamamlandı:{" "}
                              {format(m.tamamlanmaTarihi.toDate(), "dd.MM.yyyy HH:mm", {
                                locale: tr,
                              })}
                              {m.tamamlayanAd ? ` · ${m.tamamlayanAd}` : ""}
                            </div>
                          )}
                          {!tam && (
                            <div className="text-xs font-medium text-muted-foreground">
                              İşaretleyerek tamamlayın; kaldırınca bu adım ve sonrasındaki
                              adımlar da sıfırlanır.
                            </div>
                          )}
                          {m?.not ? (
                            <div className="rounded-md bg-background/80 p-2 text-sm">
                              Not: {m.not}
                            </div>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={savingMilestone}
                            onClick={() => {
                              setMilestoneNoteTip(def.tip);
                              setMilestoneNoteDraft(m?.not || "");
                              setMilestoneNoteOpen(true);
                            }}
                          >
                            Notu düzenle
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notlar" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Kurum Notları</h2>
            <Button size="sm" onClick={() => setNotFormOpen((prev) => !prev)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Not Ekle
            </Button>
          </div>

          {notFormOpen && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <Input
                  placeholder="Başlık (opsiyonel)"
                  value={noteForm.baslik}
                  onChange={(e) => setNoteForm({ ...noteForm, baslik: e.target.value })}
                />
                <Textarea
                  rows={4}
                  placeholder="Not içeriği"
                  value={noteForm.icerik}
                  onChange={(e) => setNoteForm({ ...noteForm, icerik: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} disabled={savingNote}>
                    {savingNote ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotFormOpen(false);
                      setNoteForm({ baslik: "", icerik: "" });
                    }}
                  >
                    Vazgeç
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingNotlar ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Notlar yükleniyor...
              </CardContent>
            </Card>
          ) : notlar.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Bu kurum için henüz not yok.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notlar.map((note) => (
                <Card key={note.id} className="border-l-4 border-purple-200">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">
                          {note.baslik || "Not"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {noteMeta(note)}
                        </div>
                      </div>
                      {canEditNote(note) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditNote(note)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteNote(note)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Başlık"
                          value={editNoteForm.baslik}
                          onChange={(e) =>
                            setEditNoteForm({ ...editNoteForm, baslik: e.target.value })
                          }
                        />
                        <Textarea
                          rows={4}
                          value={editNoteForm.icerik}
                          onChange={(e) =>
                            setEditNoteForm({ ...editNoteForm, icerik: e.target.value })
                          }
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateNote(note)}>
                            Kaydet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingNoteId(null)}
                          >
                            Vazgeç
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">{note.icerik}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="randevular" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Randevular</h2>
            <Button size="sm" onClick={() => setRandevuDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Bu kuruma yeni randevu ekle
            </Button>
          </div>

          {loadingRandevular ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Randevular yükleniyor...
              </CardContent>
            </Card>
          ) : kurumRandevular.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Bu kurumla henüz randevu yok.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {kurumRandevular.map((r) => (
                <Card
                  key={r.id}
                  className={cn("cursor-default border", getRandevuCardClass(r))}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-muted-foreground">
                          {format(r.tarih.toDate(), "dd.MM.yyyy EEE", { locale: tr })}
                        </div>
                        <div className="font-mono text-base font-semibold">
                          {r.baslangicSaati} – {r.bitisSaati}
                        </div>
                        <div className="mt-1 font-semibold leading-snug">
                          {r.ilgiliKisi || "İlgili kişi yok"}
                        </div>
                      </div>
                      {r.durum && (
                        <Badge variant="outline" className={RANDEVU_DURUM_RENKLERI[r.durum]}>
                          {r.durum}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {r.randevuTipi && <div>Tip: {r.randevuTipi}</div>}
                      {r.konumLink && <div>Konum/Link: {r.konumLink}</div>}
                      {r.notlar && <div>Not: {r.notlar}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="egitimler" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Eğitimler</h2>
            <Button size="sm" onClick={() => setEgitimDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Bu kuruma yeni eğitim ekle
            </Button>
          </div>

          {loadingEgitimler ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Eğitimler yükleniyor...
              </CardContent>
            </Card>
          ) : kurumEgitimler.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Bu kurumda henüz eğitim yok.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {kurumEgitimler.map((e) => (
                <Card key={e.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-muted-foreground">
                          {format(e.tarih.toDate(), "dd.MM.yyyy", { locale: tr })}
                          {e.saat ? ` · ${e.saat}` : ""}
                        </div>
                        <div className="font-semibold leading-snug">{e.egitimKonusu}</div>
                        {e.egitmen && <div className="text-sm">Eğitmen: {e.egitmen}</div>}
                      </div>
                      <Badge variant="outline" className={EGITIM_DURUM_RENKLERI[getDurum(e)]}>
                        {getDurum(e)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {e.katilimciSayisi != null && (
                        <span>Katılımcı: {e.katilimciSayisi}</span>
                      )}
                      {e.sureSaat != null && <span>Süre: {e.sureSaat} saat</span>}
                      {e.devamEdenIliski && (
                        <Badge variant="outline" className={ILISKI_RENKLERI[e.devamEdenIliski]}>
                          {e.devamEdenIliski}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gorevler" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Görevler</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingGorev(null);
                setGorevDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Bu kuruma görev ekle
            </Button>
          </div>

          {loadingGorevler ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Görevler yükleniyor...
              </CardContent>
            </Card>
          ) : kurumGorevler.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Bu kurumla ilgili görev yok.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {kurumGorevler.map((g) => (
                <Card key={g.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-snug">{g.baslik}</div>
                        {g.aciklama && (
                          <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {g.aciklama}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={ONCELIK_RENKLERI[g.oncelik]}>
                        {g.oncelik}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className={GOREV_DURUM_RENKLERI[g.durum]}>
                        {g.durum}
                      </Badge>
                      {g.atananAd && <span>Atanan: {g.atananAd}</span>}
                      {g.sonTarih && (
                        <span>Son: {format(g.sonTarih.toDate(), "dd.MM.yyyy", { locale: tr })}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {g.durum !== "Tamamlandı" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleGorevDurum(g.id, "Tamamlandı")}
                        >
                          Tamamla
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGorev(g)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {gorevDurumlari.map((d) => (
                            <DropdownMenuItem key={d} onClick={() => toggleGorevDurum(g.id, d)}>
                              Durum: {d}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteGorev(g)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <GorusmeDialog
        open={gorusmeDialogOpen}
        onOpenChange={(open) => {
          setGorusmeDialogOpen(open);
          if (!open) loadGorusme();
        }}
        gorusme={gorusme}
        allKurumlar={allGorusmelerForDup}
      />

      <Dialog open={milestoneNoteOpen} onOpenChange={setMilestoneNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adım notu</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Not</Label>
            <Textarea
              rows={4}
              value={milestoneNoteDraft}
              onChange={(e) => setMilestoneNoteDraft(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneNoteOpen(false)} disabled={savingMilestone}>
              İptal
            </Button>
            <Button onClick={handleSaveMilestoneNote} disabled={savingMilestone}>
              {savingMilestone ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RandevuDialog
        open={randevuDialogOpen}
        onOpenChange={setRandevuDialogOpen}
        defaultKurum={kurumAdi}
      />

      <EgitimDialog
        open={egitimDialogOpen}
        onOpenChange={setEgitimDialogOpen}
        defaultKurum={kurumAdi}
      />

      <GorevDialog
        open={gorevDialogOpen}
        onOpenChange={(open) => {
          setGorevDialogOpen(open);
          if (!open) setEditingGorev(null);
        }}
        gorev={editingGorev}
        defaultGorusme={{ id: gorusme.id, kurum: kurumAdi }}
      />
    </div>
  );
}

function LinkMaybe({
  label,
  href,
  social,
}: {
  label: string;
  href?: string;
  social?: "instagram" | "facebook" | "linkedin";
}) {
  const raw = href?.trim();
  if (!raw) return <InfoItem label={label} value="-" />;
  const url = social
    ? socialHref(raw, social)
    : raw.toLowerCase().startsWith("http")
      ? raw
      : `https://${raw}`;
  if (!url) return <InfoItem label={label} value="-" />;
  return (
    <div className="space-y-1 md:col-span-1">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-primary underline underline-offset-2"
      >
        {raw}
      </a>
    </div>
  );
}

function InfoItem({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1", full && "md:col-span-2")}>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
