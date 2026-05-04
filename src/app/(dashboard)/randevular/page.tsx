"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Randevular</h1>
          <p className="text-muted-foreground">
            Bugün: <span className="font-semibold text-yellow-700">{bugun}</span> · Bu hafta:{" "}
            <span className="font-semibold text-blue-700">{buHafta}</span> · Toplam:{" "}
            {randevular.length}
          </p>
        </div>
        <Button onClick={handleNew} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Randevu
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Kurum, kişi, not ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-blue-700">
              <TableRow className="hover:bg-blue-700 border-b-0">
                <TableHead className="text-white font-semibold">Tarih</TableHead>
                <TableHead className="text-white font-semibold">Saat</TableHead>
                <TableHead className="text-white font-semibold">Kurum</TableHead>
                <TableHead className="text-white font-semibold">İlgili Kişi</TableHead>
                <TableHead className="text-white font-semibold">Tip</TableHead>
                <TableHead className="text-white font-semibold">Konum/Link</TableHead>
                <TableHead className="text-white font-semibold">Durum</TableHead>
                <TableHead className="text-white font-semibold">Takvime Ekle</TableHead>
                <TableHead className="text-white font-semibold w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    {search ? "Sonuç yok" : "Henüz randevu yok. Yukarıdan ekleyebilirsin."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id} className={`cursor-pointer ${getRowClass(r)}`} onClick={() => handleEdit(r)}>
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
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Ekle
                      </Button>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(r)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r)}>
                            <Trash2 className="w-4 h-4 mr-2" />
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

      <RandevuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        randevu={editingRandevu}
      />
    </div>
  );
}
