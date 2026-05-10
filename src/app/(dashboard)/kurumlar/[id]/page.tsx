"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
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
} from "@/lib/types";
import { subscribeRandevular } from "@/lib/randevular";
import { subscribeEgitimler } from "@/lib/egitimler";
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
  ONCELIK_RENKLERI,
  RANDEVU_DURUM_RENKLERI,
  SATIS_RENKLERI,
} from "@/lib/constants";
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
import { cn } from "@/lib/utils";
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

  useEffect(() => {
    if (!user || !gorusmeId) return;

    const fetchGorusme = async () => {
      setLoadingGorusme(true);
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
        setLoadingGorusme(false);
      }
    };

    fetchGorusme();
  }, [gorusmeId, user]);

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

  const kurumAdi = gorusme?.kurum || "";

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
          <Button onClick={() => router.push("/gorusmeler")}>Görüşmelere Dön</Button>
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
          <h1 className="text-2xl font-bold md:text-3xl">{gorusme.kurum}</h1>
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
        {gorusme.kurumTipi && (
          <Badge variant="outline" className={KURUM_TIPI_RENKLERI[gorusme.kurumTipi]}>
            {gorusme.kurumTipi}
          </Badge>
        )}
        {gorusme.durum && (
          <Badge variant="outline" className={DURUM_RENKLERI[gorusme.durum]}>
            {gorusme.durum}
          </Badge>
        )}
        {gorusme.oncelik && (
          <Badge variant="outline" className={ONCELIK_RENKLERI[gorusme.oncelik]}>
            {gorusme.oncelik}
          </Badge>
        )}
        {gorusme.satisDurumu && (
          <Badge variant="outline" className={SATIS_RENKLERI[gorusme.satisDurumu]}>
            {gorusme.satisDurumu}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="bilgiler" className="gap-6">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
            <TabsTrigger value="notlar">Notlar & Zaman Çizelgesi</TabsTrigger>
            <TabsTrigger value="randevular">Randevular</TabsTrigger>
            <TabsTrigger value="egitimler">Eğitimler</TabsTrigger>
            <TabsTrigger value="gorevler">Görevler</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bilgiler">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <InfoItem label="İlgili Kişi" value={gorusme.ilgiliKisi || "-"} />
              <InfoItem label="Konumu" value={gorusme.konumu || "-"} />
              <InfoItem label="Telefon" value={gorusme.iletisimNo || "-"} />
              <InfoItem label="Mail" value={gorusme.mail || "-"} />
              <InfoItem label="İletişime Geçen" value={gorusme.iletisimeGecen || "-"} />
              <InfoItem label="Aracı" value={gorusme.araci || "-"} />
              <InfoItem label="Başlama Tarihi" value={formatDate(gorusme.baslamaTarihi)} />
              <InfoItem label="Son Temas" value={formatDate(gorusme.sonTemasTarihi)} />
              <InfoItem label="Bitiş Tarihi" value={formatDate(gorusme.bitisTarihi)} />
              <InfoItem label="Not" value={gorusme.not || "-"} full />
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
        onOpenChange={setGorusmeDialogOpen}
        gorusme={gorusme}
      />

      <RandevuDialog
        open={randevuDialogOpen}
        onOpenChange={setRandevuDialogOpen}
        defaultKurum={gorusme.kurum}
      />

      <EgitimDialog
        open={egitimDialogOpen}
        onOpenChange={setEgitimDialogOpen}
        defaultKurum={gorusme.kurum}
      />

      <GorevDialog
        open={gorevDialogOpen}
        onOpenChange={(open) => {
          setGorevDialogOpen(open);
          if (!open) setEditingGorev(null);
        }}
        gorev={editingGorev}
        defaultGorusme={{ id: gorusme.id, kurum: gorusme.kurum }}
      />
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
