"use client";

import { useState, useEffect } from "react";
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
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import { Randevu } from "@/lib/types";
import {
  subscribeRandevular,
  deleteRandevu,
  buildGoogleCalendarUrl,
} from "@/lib/randevular";
import { RANDEVU_TIPI_RENKLERI, RANDEVU_DURUM_RENKLERI } from "@/lib/constants";
import { RandevuDialog } from "@/components/randevular/randevu-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { format, isToday, isThisWeek, isPast } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function RandevularPage() {
  const { user } = useAuth();
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRandevu, setEditingRandevu] = useState<Randevu | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRandevular((data) => {
      setRandevular(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = randevular.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.kurum?.toLowerCase().includes(s) ||
      r.ilgiliKisi?.toLowerCase().includes(s) ||
      r.notlar?.toLowerCase().includes(s)
    );
  });

  const bugun = randevular.filter((r) => isToday(r.tarih.toDate())).length;
  const buHafta = randevular.filter((r) =>
    isThisWeek(r.tarih.toDate(), { weekStartsOn: 1 })
  ).length;

  const handleEdit = (r: Randevu) => {
    setEditingRandevu(r);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingRandevu(null);
    setDialogOpen(true);
  };

  const handleDelete = async (r: Randevu) => {
    if (!confirm(`${r.kurum} randevusunu silmek istediğinden emin misin?`)) return;
    try {
      await deleteRandevu(r.id);
      toast.success("Randevu silindi");
    } catch {
      toast.error("Silme başarısız");
    }
  };

  const getRowClass = (r: Randevu) => {
    const date = r.tarih.toDate();
    if (isToday(date)) return "bg-yellow-50 hover:bg-yellow-100";
    if (isPast(date) && r.durum !== "Tamamlandı" && r.durum !== "İptal")
      return "opacity-60 hover:opacity-100";
    if (isThisWeek(date, { weekStartsOn: 1 })) return "bg-blue-50/50 hover:bg-blue-100/50";
    return "hover:bg-purple-50/50";
  };

  const getCardClass = (r: Randevu) => {
    const date = r.tarih.toDate();
    if (isToday(date)) return "border-yellow-200 bg-yellow-50";
    if (isPast(date) && r.durum !== "Tamamlandı" && r.durum !== "İptal")
      return "opacity-90";
    if (isThisWeek(date, { weekStartsOn: 1 })) return "border-blue-200 bg-blue-50/50";
    return "";
  };

  const emptyMessage = search
    ? "Sonuç yok"
    : "Henüz randevu yok. Yukarıdan ekleyebilirsin.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Randevular</h1>
          <p className="text-muted-foreground">
            Bugün: <span className="font-semibold text-yellow-700">{bugun}</span> · Bu hafta:{" "}
            <span className="font-semibold text-blue-700">{buHafta}</span> · Toplam:{" "}
            {randevular.length}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Button onClick={handleNew} size="lg" className="w-full shrink-0 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Randevu
          </Button>
          <HelpPopover
            items={[
              "Arama kurum, kişi ve not alanlarını tarar.",
              "Tarih vurguları bugün ve hafta içini renklendirir.",
              "Takvime Ekle butonu Google Takvim bağlantısı açar.",
              "Düzenle/sil işlemleri üç nokta menüsünde.",
            ]}
          />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kurum, kişi, not ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-blue-700">
              <TableRow className="border-b-0 hover:bg-blue-700">
                <TableHead className="font-semibold text-white">Tarih</TableHead>
                <TableHead className="font-semibold text-white">Saat</TableHead>
                <TableHead className="font-semibold text-white">Kurum</TableHead>
                <TableHead className="font-semibold text-white">İlgili Kişi</TableHead>
                <TableHead className="font-semibold text-white">Tip</TableHead>
                <TableHead className="font-semibold text-white">Konum/Link</TableHead>
                <TableHead className="font-semibold text-white">Durum</TableHead>
                <TableHead className="font-semibold text-white">Takvime Ekle</TableHead>
                <TableHead className="w-12 font-semibold text-white"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id} className={cn("cursor-pointer", getRowClass(r))} onClick={() => handleEdit(r)}>
                    <TableCell className="font-medium">
                      {format(r.tarih.toDate(), "dd.MM.yyyy EEE", { locale: tr })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.baslangicSaati} - {r.bitisSaati}
                    </TableCell>
                    <TableCell className="font-medium">{r.kurum}</TableCell>
                    <TableCell>{r.ilgiliKisi || "-"}</TableCell>
                    <TableCell>
                      {r.randevuTipi && (
                        <Badge variant="outline" className={RANDEVU_TIPI_RENKLERI[r.randevuTipi]}>
                          {r.randevuTipi}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {r.konumLink || "-"}
                    </TableCell>
                    <TableCell>
                      {r.durum && (
                        <Badge variant="outline" className={RANDEVU_DURUM_RENKLERI[r.durum]}>
                          {r.durum}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(buildGoogleCalendarUrl(r), "_blank")
                        }
                      >
                        <CalendarPlus className="mr-1 h-4 w-4" />
                        Ekle
                      </Button>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(r)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r)}>
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
          filtered.map((r) => (
            <Card
              key={r.id}
              className={cn("cursor-pointer border", getCardClass(r))}
              onClick={() => handleEdit(r)}
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
                    <div className="mt-1 font-semibold leading-snug">{r.kurum}</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(r)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {r.ilgiliKisi && (
                  <div className="text-sm text-muted-foreground">{r.ilgiliKisi}</div>
                )}
                {r.durum && (
                  <Badge variant="outline" className={RANDEVU_DURUM_RENKLERI[r.durum]}>
                    {r.durum}
                  </Badge>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(buildGoogleCalendarUrl(r), "_blank")}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Takvime Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <RandevuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        randevu={editingRandevu}
      />
    </div>
  );
}
