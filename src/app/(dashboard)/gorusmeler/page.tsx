"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Gorusme } from "@/lib/types";
import { subscribeGorusmeler, deleteGorusme } from "@/lib/gorusmeler";
import {
  DURUM_RENKLERI,
  SATIS_RENKLERI,
  ONCELIK_RENKLERI,
  KURUM_TIPI_RENKLERI,
} from "@/lib/constants";
import { GorusmeDialog } from "@/components/gorusmeler/gorusme-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function GorusmelerPage() {
  const { user } = useAuth();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGorusme, setEditingGorusme] = useState<Gorusme | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((data) => {
      setGorusmeler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = gorusmeler.filter((g) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      g.kurum?.toLowerCase().includes(s) ||
      g.ilgiliKisi?.toLowerCase().includes(s) ||
      g.iletisimNo?.includes(s) ||
      g.mail?.toLowerCase().includes(s)
    );
  });

  const handleEdit = (g: Gorusme) => {
    setEditingGorusme(g);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingGorusme(null);
    setDialogOpen(true);
  };

  const handleDelete = async (g: Gorusme) => {
    if (!confirm(`"${g.kurum}" kurumunu silmek istediğinden emin misin?`)) return;
    try {
      await deleteGorusme(g.id);
      toast.success("Görüşme silindi");
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
    : "Henüz görüşme eklenmedi. Yukarıdan ilk kurumu ekleyebilirsin.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Görüşmeler</h1>
          <p className="text-muted-foreground">
            Toplam {gorusmeler.length} kurum
          </p>
        </div>
        <Button onClick={handleNew} size="lg" className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Görüşme
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kurum, kişi, telefon, mail ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Masaüstü tablo */}
      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-purple-900">
              <TableRow className="border-b-0 hover:bg-purple-900">
                <TableHead className="font-semibold text-white">Kurum</TableHead>
                <TableHead className="font-semibold text-white">Tip</TableHead>
                <TableHead className="font-semibold text-white">İlgili Kişi</TableHead>
                <TableHead className="font-semibold text-white">Konumu</TableHead>
                <TableHead className="font-semibold text-white">Telefon</TableHead>
                <TableHead className="font-semibold text-white">İletişime Geçen</TableHead>
                <TableHead className="font-semibold text-white">Durum</TableHead>
                <TableHead className="font-semibold text-white">Öncelik</TableHead>
                <TableHead className="font-semibold text-white">Başlama</TableHead>
                <TableHead className="font-semibold text-white">Satış</TableHead>
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
                filtered.map((g) => (
                  <TableRow key={g.id} className="cursor-pointer hover:bg-purple-50/50" onClick={() => handleEdit(g)}>
                    <TableCell className="font-medium">{g.kurum}</TableCell>
                    <TableCell>
                      {g.kurumTipi && (
                        <Badge variant="outline" className={KURUM_TIPI_RENKLERI[g.kurumTipi]}>
                          {g.kurumTipi}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{g.ilgiliKisi || "-"}</TableCell>
                    <TableCell>{g.konumu || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{g.iletisimNo || "-"}</TableCell>
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
                    <TableCell className="text-sm">{formatDate(g.baslamaTarihi)}</TableCell>
                    <TableCell>
                      {g.satisDurumu && (
                        <Badge variant="outline" className={SATIS_RENKLERI[g.satisDurumu]}>
                          {g.satisDurumu}
                        </Badge>
                      )}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobil kart listesi */}
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
            <Card
              key={g.id}
              className="cursor-pointer transition-shadow active:shadow-md"
              onClick={() => handleEdit(g)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 font-semibold leading-snug">{g.kurum}</div>
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
                  {g.durum && (
                    <Badge variant="outline" className={DURUM_RENKLERI[g.durum]}>
                      {g.durum}
                    </Badge>
                  )}
                  {g.satisDurumu && (
                    <Badge variant="outline" className={SATIS_RENKLERI[g.satisDurumu]}>
                      {g.satisDurumu}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Başlama: {formatDate(g.baslamaTarihi)}</div>
                  {g.ilgiliKisi && <div>{g.ilgiliKisi}</div>}
                  {g.iletisimNo && <div className="font-mono">{g.iletisimNo}</div>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <GorusmeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gorusme={editingGorusme}
      />
    </div>
  );
}
