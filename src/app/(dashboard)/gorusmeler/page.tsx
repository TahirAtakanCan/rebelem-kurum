"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MoreVertical, Pencil, Trash2, Download } from "lucide-react";
import type { Gorusme, KurumDurumu, SatisDurumu } from "@/lib/types";
import { subscribeGorusmeler, deleteGorusme } from "@/lib/gorusmeler";
import {
  DURUM_RENKLERI,
  ONCELIK_RENKLERI,
  KURUM_TIPI_RENKLERI,
  KURUM_DURUMLARI,
  KURUM_DURUM_RENKLERI,
  SATIS_DURUMLARI,
} from "@/lib/constants";
import { GorusmeDialog } from "@/components/gorusmeler/gorusme-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  formatEtiketlerPreview,
  getAnaKisiAd,
  getAnaKisiTelefon,
  getKurumDisplayName,
  getResolvedKurumDurumu,
  milestoneProgressLabel,
} from "@/lib/kurum-helpers";
import { exportGorusmelerToCsv } from "@/lib/export-gorusmeler";
import { gorusmeMatchesSearch } from "@/lib/search";

const SATIS_FILTER_ALL = "all";

function toggleInSet<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

export default function GorusmelerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDeferredValue(search.trim());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGorusme, setEditingGorusme] = useState<Gorusme | null>(null);

  const [sehirFilter, setSehirFilter] = useState<Set<string>>(new Set());
  const [kurumDurumFilter, setKurumDurumFilter] = useState<Set<KurumDurumu>>(
    new Set()
  );
  const [etiketFilter, setEtiketFilter] = useState<Set<string>>(new Set());
  const [satisFilter, setSatisFilter] = useState<SatisDurumu | typeof SATIS_FILTER_ALL>(
    SATIS_FILTER_ALL
  );

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((data) => {
      setGorusmeler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const sehirOptions = useMemo(() => {
    const s = new Set<string>();
    gorusmeler.forEach((g) => {
      const sh = g.sehir?.trim();
      if (sh) s.add(sh);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "tr"));
  }, [gorusmeler]);

  const etiketOptions = useMemo(() => {
    const s = new Set<string>();
    gorusmeler.forEach((g) => {
      g.etiketler?.forEach((t) => {
        const x = t.trim();
        if (x) s.add(x);
      });
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "tr"));
  }, [gorusmeler]);

  const filtered = useMemo(() => {
    return gorusmeler.filter((g) => {
      if (sehirFilter.size > 0) {
        const sh = g.sehir?.trim();
        if (!sh || !sehirFilter.has(sh)) return false;
      }
      if (kurumDurumFilter.size > 0) {
        const kd = getResolvedKurumDurumu(g);
        if (!kurumDurumFilter.has(kd)) return false;
      }
      if (etiketFilter.size > 0) {
        const tags = new Set((g.etiketler || []).map((t) => t.trim()).filter(Boolean));
        let ok = false;
        etiketFilter.forEach((t) => {
          if (tags.has(t)) ok = true;
        });
        if (!ok) return false;
      }
      if (satisFilter !== SATIS_FILTER_ALL) {
        if (g.satisDurumu !== satisFilter) return false;
      }

      if (!debouncedSearch) return true;
      return gorusmeMatchesSearch(g, debouncedSearch);
    });
  }, [
    gorusmeler,
    debouncedSearch,
    sehirFilter,
    kurumDurumFilter,
    etiketFilter,
    satisFilter,
  ]);

  const handleEdit = (g: Gorusme) => {
    setEditingGorusme(g);
    setDialogOpen(true);
  };

  const openDetail = (g: Gorusme) => {
    router.push(`/kurumlar/${g.id}`);
  };

  const handleNew = () => {
    setEditingGorusme(null);
    setDialogOpen(true);
  };

  const handleDelete = async (g: Gorusme) => {
    const ad = getKurumDisplayName(g);
    if (!confirm(`"${ad}" kurumunu silmek istediğinden emin misin?`)) return;
    try {
      await deleteGorusme(g.id);
      toast.success("Kurum silindi");
    } catch {
      toast.error("Silme başarısız");
    }
  };

  const formatDate = (ts: Gorusme["baslamaTarihi"]) => {
    if (!ts) return "-";
    return format(ts.toDate(), "dd.MM.yyyy", { locale: tr });
  };

  const emptyMessage = search
    ? "Sonuç bulunamadı"
    : "Henüz kurum eklenmedi. Yukarıdan ilk kaydı oluşturabilirsin.";

  const colspan = 14;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Kurumlar</h1>
          <p className="text-muted-foreground">
            Toplam {gorusmeler.length} kurum
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end">
            <Button onClick={handleNew} size="lg" className="w-full shrink-0 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kurum
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              disabled={!gorusmeler.length}
              onClick={() => {
                exportGorusmelerToCsv(gorusmeler);
                toast.success("CSV indirildi");
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <HelpPopover
              items={[
                "Satıra tıklayınca kurum detayına gidersin.",
                "Düzenle/sil işlemleri üç nokta menüsünde.",
                "Çoklu filtreleri üstteki çiplerle seç; satış filtresi eski kayıtlar içindir.",
                "Liste CSV ile dışa aktarılabilir.",
              ]}
            />
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kurum, şehir, kişi, etiket ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Şehir
          </span>
          <div className="flex flex-wrap gap-2">
            {sehirOptions.length === 0 ? (
              <span className="text-sm text-muted-foreground">Kayıtta şehir yok</span>
            ) : (
              sehirOptions.map((city) => {
                const active = sehirFilter.has(city);
                return (
                  <Button
                    key={city}
                    type="button"
                    size="sm"
                    variant={active ? "secondary" : "outline"}
                    className="h-8"
                    onClick={() => setSehirFilter(toggleInSet(sehirFilter, city))}
                  >
                    {city}
                  </Button>
                );
              })
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Kurum durumu
          </span>
          <div className="flex flex-wrap gap-2">
            {KURUM_DURUMLARI.map((d) => {
              const active = kurumDurumFilter.has(d);
              return (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={active ? "secondary" : "outline"}
                  className={`h-8 ${active ? KURUM_DURUM_RENKLERI[d] : ""}`}
                  onClick={() =>
                    setKurumDurumFilter(toggleInSet(kurumDurumFilter, d))
                  }
                >
                  {d}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Etiket
          </span>
          <div className="flex flex-wrap gap-2">
            {etiketOptions.length === 0 ? (
              <span className="text-sm text-muted-foreground">Etiket yok</span>
            ) : (
              etiketOptions.map((tag) => {
                const active = etiketFilter.has(tag);
                return (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant={active ? "secondary" : "outline"}
                    className="h-8"
                    onClick={() => setEtiketFilter(toggleInSet(etiketFilter, tag))}
                  >
                    {tag}
                  </Button>
                );
              })
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Satış (legacy)
            </div>
            <Select
              value={satisFilter}
              onValueChange={(v) =>
                setSatisFilter(v as SatisDurumu | typeof SATIS_FILTER_ALL)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Satış filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SATIS_FILTER_ALL}>Tümü</SelectItem>
                {SATIS_DURUMLARI.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(sehirFilter.size > 0 ||
            kurumDurumFilter.size > 0 ||
            etiketFilter.size > 0 ||
            satisFilter !== SATIS_FILTER_ALL) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSehirFilter(new Set());
                setKurumDurumFilter(new Set());
                setEtiketFilter(new Set());
                setSatisFilter(SATIS_FILTER_ALL);
              }}
            >
              Filtreleri temizle
            </Button>
          )}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-purple-900">
              <TableRow className="border-b-0 hover:bg-purple-900">
                <TableHead className="min-w-[8rem] font-semibold text-white">
                  Kurum
                </TableHead>
                <TableHead className="font-semibold text-white">Şehir</TableHead>
                <TableHead className="font-semibold text-white">Tip</TableHead>
                <TableHead className="font-semibold text-white">Ana Kişi</TableHead>
                <TableHead className="font-semibold text-white">Konumu</TableHead>
                <TableHead className="font-semibold text-white">Telefon</TableHead>
                <TableHead className="font-semibold text-white whitespace-nowrap">
                  Süreç
                </TableHead>
                <TableHead className="min-w-[7rem] font-semibold text-white">
                  Etiketler
                </TableHead>
                <TableHead className="font-semibold text-white">
                  İletişime Geçen
                </TableHead>
                <TableHead className="font-semibold text-white">Süreç (eski)</TableHead>
                <TableHead className="font-semibold text-white">Öncelik</TableHead>
                <TableHead className="font-semibold text-white">Başlama</TableHead>
                <TableHead className="font-semibold text-white whitespace-nowrap">
                  Kurum Durumu
                </TableHead>
                <TableHead className="w-12 font-semibold text-white"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={colspan}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colspan}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((g) => {
                  const kd = getResolvedKurumDurumu(g);
                  const { shown, rest } = formatEtiketlerPreview(g.etiketler, 2);
                  return (
                    <TableRow
                      key={g.id}
                      className="cursor-pointer hover:bg-purple-50/50"
                      onClick={() => openDetail(g)}
                    >
                      <TableCell className="font-medium">
                        {getKurumDisplayName(g)}
                      </TableCell>
                      <TableCell>{g.sehir?.trim() || "-"}</TableCell>
                      <TableCell>
                        {g.kurumTipi && (
                          <Badge
                            variant="outline"
                            className={KURUM_TIPI_RENKLERI[g.kurumTipi]}
                          >
                            {g.kurumTipi}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getAnaKisiAd(g)}</TableCell>
                      <TableCell className="max-w-[10rem] truncate">
                        {g.konumu || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {getAnaKisiTelefon(g)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm tabular-nums">
                        {milestoneProgressLabel(g.milestones)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {shown.length ? (
                          <span className="flex flex-wrap gap-1">
                            {shown.map((t) => (
                              <Badge key={t} variant="secondary" className="font-normal">
                                {t}
                              </Badge>
                            ))}
                            {rest > 0 && (
                              <Badge variant="outline">+{rest}</Badge>
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{g.iletisimeGecen || "-"}</TableCell>
                      <TableCell>
                        {g.durum && (
                          <Badge variant="outline" className={DURUM_RENKLERI[g.durum]}>
                            {g.durum}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {g.oncelik && (
                          <Badge variant="outline" className={ONCELIK_RENKLERI[g.oncelik]}>
                            {g.oncelik}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(g.baslamaTarihi)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={KURUM_DURUM_RENKLERI[kd]}>
                          {kd}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(g)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
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
          filtered.map((g) => {
            const kd = getResolvedKurumDurumu(g);
            const { shown, rest } = formatEtiketlerPreview(g.etiketler, 2);
            return (
              <Card
                key={g.id}
                className="cursor-pointer transition-shadow active:shadow-md"
                onClick={() => openDetail(g)}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 font-semibold leading-snug">
                      {getKurumDisplayName(g)}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(g)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.kurumTipi && (
                      <Badge variant="outline" className={KURUM_TIPI_RENKLERI[g.kurumTipi]}>
                        {g.kurumTipi}
                      </Badge>
                    )}
                    <Badge variant="outline" className={KURUM_DURUM_RENKLERI[kd]}>
                      {kd}
                    </Badge>
                    {g.durum && (
                      <Badge variant="outline" className={DURUM_RENKLERI[g.durum]}>
                        {g.durum}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {g.sehir && <div>{g.sehir}</div>}
                    <div>Süreç: {milestoneProgressLabel(g.milestones)}</div>
                    {shown.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {shown.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                        {rest > 0 && <Badge variant="outline">+{rest}</Badge>}
                      </div>
                    )}
                    <div>Başlama: {formatDate(g.baslamaTarihi)}</div>
                    <div>{getAnaKisiAd(g)}</div>
                    <div className="font-mono">{getAnaKisiTelefon(g)}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <GorusmeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gorusme={editingGorusme}
        allKurumlar={gorusmeler}
      />
    </div>
  );
}
