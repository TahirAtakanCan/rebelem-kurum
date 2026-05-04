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

  // Firestore'dan gerçek zamanlı veri (sadece giriş yapılmışsa)
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((data) => {
      setGorusmeler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Arama filtresi
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Görüşmeler</h1>
          <p className="text-muted-foreground">
            Toplam {gorusmeler.length} kurum
          </p>
        </div>
        <Button onClick={handleNew} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Görüşme
        </Button>
      </div>

      {/* Arama */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Kurum, kişi, telefon, mail ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tablo */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-purple-900">
              <TableRow className="hover:bg-purple-900 border-b-0">
                <TableHead className="text-white font-semibold">Kurum</TableHead>
                <TableHead className="text-white font-semibold">Tip</TableHead>
                <TableHead className="text-white font-semibold">İlgili Kişi</TableHead>
                <TableHead className="text-white font-semibold">Konumu</TableHead>
                <TableHead className="text-white font-semibold">Telefon</TableHead>
                <TableHead className="text-white font-semibold">İletişime Geçen</TableHead>
                <TableHead className="text-white font-semibold">Durum</TableHead>
                <TableHead className="text-white font-semibold">Öncelik</TableHead>
                <TableHead className="text-white font-semibold">Başlama</TableHead>
                <TableHead className="text-white font-semibold">Satış</TableHead>
                <TableHead className="text-white font-semibold w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    {search ? "Sonuç bulunamadı" : "Henüz görüşme eklenmedi. Yukarıdan ilk kurumu ekleyebilirsin."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((g) => (
                  <TableRow key={g.id} className="hover:bg-purple-50/50 cursor-pointer" onClick={() => handleEdit(g)}>
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
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(g)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(g)}>
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

      {/* Dialog */}
      <GorusmeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gorusme={editingGorusme}
      />
    </div>
  );
}
