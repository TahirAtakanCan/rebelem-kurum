"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isBefore, isToday, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gorev, GorevDurumu, GorevOnceligi, Gorusme } from "@/lib/types";
import { subscribeGorevler, deleteGorev, toggleGorevDurum } from "@/lib/gorevler";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import {
  EKIP_UYELERI,
  GOREV_DURUMLARI,
  GOREV_DURUM_RENKLERI,
  ONCELIKLER,
  ONCELIK_RENKLERI,
} from "@/lib/constants";
import { GorevDialog } from "@/components/gorevler/gorev-dialog";
import { HelpPopover } from "@/components/ui/help-popover";
import { useAuth } from "@/components/auth/auth-provider";
import { Plus, Search, MoreVertical, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const durumSutunlari: GorevDurumu[] = ["Bekliyor", "Yapılıyor", "Tamamlandı"];

export default function GorevlerPage() {
  const { user } = useAuth();
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [durumFilter, setDurumFilter] = useState<GorevDurumu | "all">("all");
  const [oncelikFilter, setOncelikFilter] = useState<GorevOnceligi | "all">("all");
  const [atananFilter, setAtananFilter] = useState<string>("all");
  const [view, setView] = useState("kart");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Gorev | null>(null);
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorevler((data) => {
      setGorevler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

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
    gorevler.forEach((g) => {
      if (g.atananAd) isimler.add(g.atananAd);
    });
    return Array.from(isimler).sort((a, b) => a.localeCompare(b, "tr"));
  }, [gorusmeler, gorevler]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return gorevler.filter((g) => {
      const searchMatch =
        !search ||
        g.baslik.toLowerCase().includes(s) ||
        g.aciklama?.toLowerCase().includes(s) ||
        g.gorusmeKurum?.toLowerCase().includes(s) ||
        g.atananAd?.toLowerCase().includes(s);
      if (!searchMatch) return false;
      if (durumFilter !== "all" && g.durum !== durumFilter) return false;
      if (oncelikFilter !== "all" && g.oncelik !== oncelikFilter) return false;
      if (atananFilter !== "all" && g.atananAd !== atananFilter) return false;
      return true;
    });
  }, [gorevler, search, durumFilter, oncelikFilter, atananFilter]);

  const todayTasks = useMemo(() => {
    const todayEnd = endOfDay(new Date());
    return filtered.filter((g) => {
      if (g.durum === "Tamamlandı") return false;
      if (!g.sonTarih) return false;
      const due = g.sonTarih.toDate();
      return isToday(due) || isBefore(due, todayEnd);
    });
  }, [filtered]);

  const handleDelete = async (g: Gorev) => {
    if (!confirm(`"${g.baslik}" görevini silmek istediğinden emin misin?`)) return;
    try {
      await deleteGorev(g.id);
      toast.success("Görev silindi");
    } catch {
      toast.error("Silme başarısız");
    }
  };

  const openEdit = (g: Gorev) => {
    setEditing(g);
    setDialogOpen(true);
  };

  const handleComplete = async (g: Gorev) => {
    await toggleGorevDurum(g.id, "Tamamlandı");
  };

  const formatDate = (ts?: Gorev["sonTarih"]) => {
    if (!ts) return "-";
    return format(ts.toDate(), "dd.MM.yyyy", { locale: tr });
  };

  const emptyMessage = search ? "Sonuç yok" : "Henüz görev yok.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Görevler</h1>
          <p className="text-muted-foreground">Ekip görev takibi</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-full shrink-0 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Görev
          </Button>
          <HelpPopover
            items={[
              "Kart görünümünde sütunlar duruma göre ayrılır.",
              "Tamamla ile görev hızlıca kapatılır.",
              "Filtreler: durum, öncelik ve atanan kişi.",
              "Bugün görünümü geciken işleri listeler.",
              "Düzenle/sil ve durum değişimi üç nokta menüsünde.",
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Başlık, kurum, kişi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={durumFilter}
            onValueChange={(v) => setDurumFilter(v as GorevDurumu | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {GOREV_DURUMLARI.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={oncelikFilter}
            onValueChange={(v) => setOncelikFilter(v as GorevOnceligi | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Öncelik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {ONCELIKLER.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={atananFilter} onValueChange={(v) => setAtananFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Atanan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {kullaniciListesi.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView} className="gap-6">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="liste">Liste</TabsTrigger>
            <TabsTrigger value="kart">Kart</TabsTrigger>
            <TabsTrigger value="bugun">Bugün</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="liste">
          <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
            <Table>
              <TableHeader className="bg-gray-800">
                <TableRow className="border-b-0 hover:bg-gray-800">
                  <TableHead className="font-semibold text-white">Başlık</TableHead>
                  <TableHead className="font-semibold text-white">Durum</TableHead>
                  <TableHead className="font-semibold text-white">Öncelik</TableHead>
                  <TableHead className="font-semibold text-white">Atanan</TableHead>
                  <TableHead className="font-semibold text-white">Kurum</TableHead>
                  <TableHead className="font-semibold text-white">Son Tarih</TableHead>
                  <TableHead className="w-12 font-semibold text-white"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((g) => (
                    <TableRow key={g.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">{g.baslik}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={GOREV_DURUM_RENKLERI[g.durum]}>
                          {g.durum}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ONCELIK_RENKLERI[g.oncelik]}>
                          {g.oncelik}
                        </Badge>
                      </TableCell>
                      <TableCell>{g.atananAd || "-"}</TableCell>
                      <TableCell>
                        {g.gorusmeId ? (
                          <Link className="text-blue-600 hover:underline" href={`/kurumlar/${g.gorusmeId}`}>
                            {g.gorusmeKurum}
                          </Link>
                        ) : (
                          g.gorusmeKurum || "-"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(g.sonTarih)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(g)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            {durumSutunlari.map((d) => (
                              <DropdownMenuItem key={d} onClick={() => toggleGorevDurum(g.id, d)}>
                                Durum: {d}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Yükleniyor...
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </CardContent>
              </Card>
            ) : (
              filtered.map((g) => (
                <Card key={g.id} className="border">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold leading-snug">{g.baslik}</div>
                      <Badge variant="outline" className={ONCELIK_RENKLERI[g.oncelik]}>
                        {g.oncelik}
                      </Badge>
                    </div>
                    {g.aciklama && (
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {g.aciklama}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {g.atananAd && <span>Atanan: {g.atananAd}</span>}
                      {g.gorusmeKurum && <span>Kurum: {g.gorusmeKurum}</span>}
                      {g.sonTarih && <span>Son: {formatDate(g.sonTarih)}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={GOREV_DURUM_RENKLERI[g.durum]}>
                        {g.durum}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(g)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {durumSutunlari.map((d) => (
                            <DropdownMenuItem key={d} onClick={() => toggleGorevDurum(g.id, d)}>
                              Durum: {d}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="kart">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Yükleniyor...
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {emptyMessage}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {durumSutunlari.map((durum) => (
                <div key={durum} className="space-y-3">
                  <div className="text-sm font-semibold text-muted-foreground">
                    {durum}
                  </div>
                  <div className="space-y-3">
                    {filtered.filter((g) => g.durum === durum).length === 0 ? (
                      <Card>
                        <CardContent className="py-6 text-center text-muted-foreground">
                          Bu sütunda görev yok
                        </CardContent>
                      </Card>
                    ) : (
                      filtered
                        .filter((g) => g.durum === durum)
                        .map((g) => (
                          <Card key={g.id}>
                            <CardContent className="space-y-3 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold leading-snug">{g.baslik}</div>
                                <Badge variant="outline" className={ONCELIK_RENKLERI[g.oncelik]}>
                                  {g.oncelik}
                                </Badge>
                              </div>
                              {g.aciklama && (
                                <div className="line-clamp-2 text-sm text-muted-foreground">
                                  {g.aciklama}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {g.atananAd && (
                                  <span className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold">
                                      {getInitials(g.atananAd)}
                                    </span>
                                    {g.atananAd}
                                  </span>
                                )}
                                {g.gorusmeId && g.gorusmeKurum && (
                                  <Link className="text-blue-600 hover:underline" href={`/kurumlar/${g.gorusmeId}`}>
                                    {g.gorusmeKurum}
                                  </Link>
                                )}
                                {!g.gorusmeId && g.gorusmeKurum && (
                                  <span>{g.gorusmeKurum}</span>
                                )}
                                {g.sonTarih && <span>Son: {formatDate(g.sonTarih)}</span>}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                {g.durum !== "Tamamlandı" ? (
                                  <Button size="sm" variant="outline" onClick={() => handleComplete(g)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Tamamla
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className={GOREV_DURUM_RENKLERI[g.durum]}>
                                    {g.durum}
                                  </Badge>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEdit(g)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Düzenle
                                    </DropdownMenuItem>
                                    {durumSutunlari.map((d) => (
                                      <DropdownMenuItem key={d} onClick={() => toggleGorevDurum(g.id, d)}>
                                        Durum: {d}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Sil
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bugun">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Yükleniyor...
              </CardContent>
            </Card>
          ) : todayTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Bugün bitmesi gereken görev yok.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((g) => (
                <Card key={g.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold leading-snug">{g.baslik}</div>
                      <Badge variant="outline" className={ONCELIK_RENKLERI[g.oncelik]}>
                        {g.oncelik}
                      </Badge>
                    </div>
                    {g.aciklama && (
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {g.aciklama}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {g.atananAd && <span>Atanan: {g.atananAd}</span>}
                      {g.gorusmeKurum && <span>Kurum: {g.gorusmeKurum}</span>}
                      {g.sonTarih && <span>Son: {formatDate(g.sonTarih)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleComplete(g)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Tamamla
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(g)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {durumSutunlari.map((d) => (
                            <DropdownMenuItem key={d} onClick={() => toggleGorevDurum(g.id, d)}>
                              Durum: {d}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
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

      <GorevDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        gorev={editing}
      />
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
