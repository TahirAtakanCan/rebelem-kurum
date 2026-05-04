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

  const openEdit = (e: Egitim) => {
    setEditing(e);
    setDialogOpen(true);
  };

  const emptyMessage = search ? "Sonuç yok" : "Henüz eğitim yok.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Eğitimler</h1>
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
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Eğitim
        </Button>
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

      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-green-700">
              <TableRow className="border-b-0 hover:bg-green-700">
                <TableHead className="font-semibold text-white">Tarih</TableHead>
                <TableHead className="font-semibold text-white">Kurum</TableHead>
                <TableHead className="font-semibold text-white">Konu</TableHead>
                <TableHead className="font-semibold text-white">Eğitmen</TableHead>
                <TableHead className="text-right font-semibold text-white">Katılımcı</TableHead>
                <TableHead className="text-right font-semibold text-white">Saat</TableHead>
                <TableHead className="text-right font-semibold text-white">Ücret</TableHead>
                <TableHead className="font-semibold text-white">Tahsilat</TableHead>
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
                    className="cursor-pointer hover:bg-green-50/50"
                    onClick={() => openEdit(e)}
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
              className="cursor-pointer border transition-shadow active:shadow-md"
              onClick={() => openEdit(e)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-muted-foreground">
                      {format(e.tarih.toDate(), "dd.MM.yyyy", { locale: tr })}
                    </div>
                    <div className="font-semibold leading-snug">{e.kurum}</div>
                    <div className="mt-1 text-sm leading-snug">{e.egitimKonusu}</div>
                  </div>
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
                  {e.ucret != null && e.ucret > 0 && (
                    <span className="font-mono text-sm font-medium">
                      ₺{e.ucret.toLocaleString("tr-TR")}
                    </span>
                  )}
                  {e.tahsilatDurumu && (
                    <Badge variant="outline" className={TAHSILAT_RENKLERI[e.tahsilatDurumu]}>
                      {e.tahsilatDurumu}
                    </Badge>
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
