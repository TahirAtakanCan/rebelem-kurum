"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DevamEdenIliski, Egitim, EgitimDurumu } from "@/lib/types";
import { subscribeEgitimler, deleteEgitim } from "@/lib/egitimler";
import {
  DEVAM_EDEN_ILISKILER,
  EGITIM_DURUMLARI,
  EGITIM_DURUM_RENKLERI,
  ILISKI_RENKLERI,
} from "@/lib/constants";
import { EgitimDialog } from "@/components/egitimler/egitim-dialog";
import { HelpPopover } from "@/components/ui/help-popover";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function EgitimlerPage() {
  const { user } = useAuth();
  const [egitimler, setEgitimler] = useState<Egitim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Egitim | null>(null);
  const [durumFiltreleri, setDurumFiltreleri] = useState<EgitimDurumu[]>([]);
  const [iliskiFiltre, setIliskiFiltre] = useState<DevamEdenIliski | "all">("all");
  const [geriBildirimFiltre, setGeriBildirimFiltre] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeEgitimler((data) => {
      setEgitimler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const getDurum = (e: Egitim): EgitimDurumu => e.egitimDurumu || "Tamamlandı";

  const toggleDurum = (durum: EgitimDurumu) => {
    setDurumFiltreleri((prev) =>
      prev.includes(durum) ? prev.filter((d) => d !== durum) : [...prev, durum]
    );
  };

  const filtered = egitimler.filter((e) => {
    const s = search.toLowerCase();
    const searchMatch =
      !search ||
      e.kurum?.toLowerCase().includes(s) ||
      e.egitimKonusu?.toLowerCase().includes(s) ||
      e.egitmen?.toLowerCase().includes(s);
    if (!searchMatch) return false;
    const durum = getDurum(e);
    if (durumFiltreleri.length > 0 && !durumFiltreleri.includes(durum)) return false;
    if (iliskiFiltre !== "all" && e.devamEdenIliski !== iliskiFiltre) return false;
    if (geriBildirimFiltre !== "all") {
      const target = Number(geriBildirimFiltre);
      if ((e.geriBildirimPuani || 0) !== target) return false;
    }
    return true;
  });

  const planlanan = egitimler.filter((e) => getDurum(e) === "Planlandı").length;
  const tamamlanan = egitimler.filter((e) => getDurum(e) === "Tamamlandı").length;
  const toplamKatilimci = egitimler.reduce(
    (sum, e) => sum + (e.katilimciSayisi || 0),
    0
  );

  const handleDelete = async (e: Egitim) => {
    if (!confirm(`"${e.egitimKonusu}" eğitimini silmek istediğinden emin misin?`)) return;
    try {
      await deleteEgitim(e.id);
      toast.success("Eğitim silindi");
    } catch {
      toast.error("Silme başarısız");
    }
  };

  const openEdit = (e: Egitim) => {
    setEditing(e);
    setDialogOpen(true);
  };

  const getRowClass = (e: Egitim) => {
    const durum = getDurum(e);
    if (durum === "Tamamlandı") return "bg-green-50/30 hover:bg-green-50";
    if (durum === "İptal" || durum === "Ertelendi") return "opacity-60";
    return "hover:bg-green-50/50";
  };

  const getCardClass = (e: Egitim) => {
    const durum = getDurum(e);
    if (durum === "Tamamlandı") return "border-green-200 bg-green-50/30";
    if (durum === "İptal" || durum === "Ertelendi") return "opacity-60";
    return "";
  };

  const emptyMessage = search ? "Sonuç yok" : "Henüz eğitim yok.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Eğitimler</h1>
          <p className="text-muted-foreground">
            {egitimler.length} eğitim · Planlandı:{" "}
            <span className="font-semibold text-blue-700">{planlanan}</span> · Tamamlandı:{" "}
            <span className="font-semibold text-green-700">{tamamlanan}</span> · Toplam
            Katılımcı: <span className="font-semibold">{toplamKatilimci}</span>
          </p>
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
            Yeni Eğitim
          </Button>
          <HelpPopover
            items={[
              "Arama kurum, konu ve eğitmen alanlarını tarar.",
              "Durum, ilişki ve geri bildirim süzgeçleri üst bölümde.",
              "Satır veya karta tıklayınca düzenleme açılır.",
              "Özet rakamları başlıkta; iptal ve ertelenenler soluk görünür.",
              "Düzenle/sil işlemleri üç nokta menüsünde.",
            ]}
          />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kurum, konu, eğitmen ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Eğitim Durumu
            </div>
            <div className="flex flex-wrap gap-2">
              {EGITIM_DURUMLARI.map((durum) => {
                const active = durumFiltreleri.includes(durum);
                return (
                  <Button
                    key={durum}
                    type="button"
                    size="sm"
                    variant={active ? "secondary" : "outline"}
                    className={active ? EGITIM_DURUM_RENKLERI[durum] : ""}
                    onClick={() => toggleDurum(durum)}
                  >
                    {durum}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Devam Eden İlişki
              </div>
              <Select
                value={iliskiFiltre}
                onValueChange={(v) => setIliskiFiltre(v as DevamEdenIliski | "all")}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {DEVAM_EDEN_ILISKILER.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Geri Bildirim
              </div>
              <Select
                value={geriBildirimFiltre}
                onValueChange={(v) => setGeriBildirimFiltre(v)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {"⭐".repeat(n)} ({n})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-green-700">
              <TableRow className="border-b-0 hover:bg-green-700">
                <TableHead className="font-semibold text-white">Tarih</TableHead>
                <TableHead className="font-semibold text-white">Saat</TableHead>
                <TableHead className="font-semibold text-white">Kurum</TableHead>
                <TableHead className="font-semibold text-white">Konu</TableHead>
                <TableHead className="font-semibold text-white">Eğitmen</TableHead>
                <TableHead className="text-right font-semibold text-white">Katılımcı</TableHead>
                <TableHead className="text-right font-semibold text-white">Süre</TableHead>
                <TableHead className="font-semibold text-white">Durum</TableHead>
                <TableHead className="font-semibold text-white">Geri Bildirim</TableHead>
                <TableHead className="font-semibold text-white">İlişki</TableHead>
                <TableHead className="w-12 font-semibold text-white"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow
                    key={e.id}
                    className={cn("cursor-pointer", getRowClass(e))}
                    onClick={() => openEdit(e)}
                  >
                    <TableCell className="font-medium">
                      {format(e.tarih.toDate(), "dd.MM.yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {e.saat || "-"}
                    </TableCell>
                    <TableCell className="font-medium">{e.kurum}</TableCell>
                    <TableCell>{e.egitimKonusu}</TableCell>
                    <TableCell>{e.egitmen || "-"}</TableCell>
                    <TableCell className="text-right">{e.katilimciSayisi || "-"}</TableCell>
                    <TableCell className="text-right">{e.sureSaat || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={EGITIM_DURUM_RENKLERI[getDurum(e)]}
                      >
                        {getDurum(e)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.geriBildirimPuani ? "⭐".repeat(e.geriBildirimPuani) : "-"}
                    </TableCell>
                    <TableCell>
                      {e.devamEdenIliski && (
                        <Badge variant="outline" className={ILISKI_RENKLERI[e.devamEdenIliski]}>
                          {e.devamEdenIliski}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(e)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(e)}>
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
          filtered.map((e) => (
            <Card
              key={e.id}
              className={cn("cursor-pointer border transition-shadow active:shadow-md", getCardClass(e))}
              onClick={() => openEdit(e)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-muted-foreground">
                      {format(e.tarih.toDate(), "dd.MM.yyyy", { locale: tr })}
                      {e.saat ? ` · ${e.saat}` : ""}
                    </div>
                    <div className="font-semibold leading-snug">{e.kurum}</div>
                    <div className="mt-1 text-sm leading-snug">{e.egitimKonusu}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={EGITIM_DURUM_RENKLERI[getDurum(e)]}
                  >
                    {getDurum(e)}
                  </Badge>
                  <div onClick={(ev) => ev.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(e)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(e)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {e.sureSaat && <span className="text-sm">Süre: {e.sureSaat} saat</span>}
                  {e.katilimciSayisi && (
                    <span className="text-sm">Katılımcı: {e.katilimciSayisi}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EgitimDialog open={dialogOpen} onOpenChange={setDialogOpen} egitim={editing} />
    </div>
  );
}
