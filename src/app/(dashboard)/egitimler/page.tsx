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
import { Egitim } from "@/lib/types";
import { subscribeEgitimler, deleteEgitim } from "@/lib/egitimler";
import { TAHSILAT_RENKLERI, ILISKI_RENKLERI } from "@/lib/constants";
import { EgitimDialog } from "@/components/egitimler/egitim-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function EgitimlerPage() {
  const { user } = useAuth();
  const [egitimler, setEgitimler] = useState<Egitim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Egitim | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeEgitimler((data) => {
      setEgitimler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = egitimler.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.kurum?.toLowerCase().includes(s) ||
      e.egitimKonusu?.toLowerCase().includes(s) ||
      e.egitmen?.toLowerCase().includes(s)
    );
  });

  const toplamCiro = egitimler.reduce((sum, e) => sum + (e.ucret || 0), 0);
  const tahsilEdilen = egitimler
    .filter((e) => e.tahsilatDurumu === "Tahsil Edildi")
    .reduce((sum, e) => sum + (e.ucret || 0), 0);

  const handleDelete = async (e: Egitim) => {
    if (!confirm(`"${e.egitimKonusu}" eğitimini silmek istediğinden emin misin?`)) return;
    try {
      await deleteEgitim(e.id);
      toast.success("Eğitim silindi");
    } catch {
      toast.error("Silme başarısız");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eğitimler</h1>
          <p className="text-muted-foreground">
            {egitimler.length} eğitim · Ciro:{" "}
            <span className="font-semibold text-green-700">
              ₺{toplamCiro.toLocaleString("tr-TR")}
            </span>{" "}
            · Tahsil:{" "}
            <span className="font-semibold text-blue-700">
              ₺{tahsilEdilen.toLocaleString("tr-TR")}
            </span>
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Eğitim
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Kurum, konu, eğitmen ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-green-700">
              <TableRow className="hover:bg-green-700 border-b-0">
                <TableHead className="text-white font-semibold">Tarih</TableHead>
                <TableHead className="text-white font-semibold">Kurum</TableHead>
                <TableHead className="text-white font-semibold">Konu</TableHead>
                <TableHead className="text-white font-semibold">Eğitmen</TableHead>
                <TableHead className="text-white font-semibold text-right">Katılımcı</TableHead>
                <TableHead className="text-white font-semibold text-right">Saat</TableHead>
                <TableHead className="text-white font-semibold text-right">Ücret</TableHead>
                <TableHead className="text-white font-semibold">Tahsilat</TableHead>
                <TableHead className="text-white font-semibold">Geri Bildirim</TableHead>
                <TableHead className="text-white font-semibold">İlişki</TableHead>
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
                    {search ? "Sonuç yok" : "Henüz eğitim yok."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-green-50/50"
                    onClick={() => {
                      setEditing(e);
                      setDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      {format(e.tarih.toDate(), "dd.MM.yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell className="font-medium">{e.kurum}</TableCell>
                    <TableCell>{e.egitimKonusu}</TableCell>
                    <TableCell>{e.egitmen || "-"}</TableCell>
                    <TableCell className="text-right">{e.katilimciSayisi || "-"}</TableCell>
                    <TableCell className="text-right">{e.sureSaat || "-"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {e.ucret ? `₺${e.ucret.toLocaleString("tr-TR")}` : "-"}
                    </TableCell>
                    <TableCell>
                      {e.tahsilatDurumu && (
                        <Badge variant="outline" className={TAHSILAT_RENKLERI[e.tahsilatDurumu]}>
                          {e.tahsilatDurumu}
                        </Badge>
                      )}
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
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(e);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(e)}>
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

      <EgitimDialog open={dialogOpen} onOpenChange={setDialogOpen} egitim={editing} />
    </div>
  );
}
