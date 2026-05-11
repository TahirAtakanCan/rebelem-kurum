"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format,
  isBefore,
  isToday,
  startOfDay,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  GraduationCap,
  ListTodo,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpPopover } from "@/components/ui/help-popover";
import type { Egitim, EgitimDurumu, Gorev, Gorusme, Randevu } from "@/lib/types";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { subscribeRandevular } from "@/lib/randevular";
import { subscribeEgitimler } from "@/lib/egitimler";
import { subscribeGorevler } from "@/lib/gorevler";
import { useAuth } from "@/components/auth/auth-provider";
import { kritikHatirlatmaOzetSayisi } from "@/lib/hatirlatmalar";
import { GOREV_DURUM_RENKLERI, RANDEVU_DURUM_RENKLERI } from "@/lib/constants";
import { cn } from "@/lib/utils";

function egitimDurum(e: Egitim): EgitimDurumu {
  return e.egitimDurumu || "Tamamlandı";
}

function gorevAcik(g: Gorev): boolean {
  return g.durum !== "Tamamlandı";
}

export default function GunlukPage() {
  const { user } = useAuth();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [egitimler, setEgitimler] = useState<Egitim[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let n = 0;
    const mark = () => {
      n += 1;
      if (n >= 4) setReady(true);
    };
    const u1 = subscribeGorusmeler((d) => {
      setGorusmeler(d);
      mark();
    });
    const u2 = subscribeRandevular((d) => {
      setRandevular(d);
      mark();
    });
    const u3 = subscribeEgitimler((d) => {
      setEgitimler(d);
      mark();
    });
    const u4 = subscribeGorevler((d) => {
      setGorevler(d);
      mark();
    });
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [user]);

  const bugunStr = format(new Date(), "d MMMM yyyy, EEEE", { locale: tr });

  const randevuBugun = useMemo(() => {
    return randevular.filter((r) => {
      if (!isToday(r.tarih.toDate())) return false;
      if (r.durum === "İptal") return false;
      return true;
    });
  }, [randevular]);

  const egitimBugun = useMemo(() => {
    return egitimler.filter((e) => {
      if (!isToday(e.tarih.toDate())) return false;
      const d = egitimDurum(e);
      if (d === "İptal") return false;
      return true;
    });
  }, [egitimler]);

  const gorevGecikmisListe = useMemo(() => {
    const dayStart = startOfDay(new Date());
    return gorevler.filter(
      (g) => gorevAcik(g) && g.sonTarih && isBefore(g.sonTarih.toDate(), dayStart)
    );
  }, [gorevler]);

  const gorevBugunSonListe = useMemo(
    () =>
      gorevler.filter(
        (g) => gorevAcik(g) && g.sonTarih && isToday(g.sonTarih.toDate())
      ),
    [gorevler]
  );

  const gorevTarihsizAcik = useMemo(
    () =>
      gorevler.filter(
        (g) => gorevAcik(g) && !g.sonTarih
      ),
    [gorevler]
  );

  const hatirlatmaOzet = useMemo(
    () => kritikHatirlatmaOzetSayisi(gorusmeler),
    [gorusmeler]
  );

  const toplamGunluk =
    randevuBugun.length +
    egitimBugun.length +
    gorevGecikmisListe.length +
    gorevBugunSonListe.length;

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Günlük</h1>
          <p className="text-muted-foreground">{bugunStr}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bugün odaklanmanız gereken randevu, eğitim ve görevler tek ekranda.
          </p>
        </div>
        <HelpPopover
          title="Bu sayfa"
          items={[
            "Randevular ve eğitimler yalnızca bugünün tarihine göre listelenir.",
            "Görevler: son tarihi geçmiş veya bugün olan tamamlanmamış kayıtlar.",
            "Kritik hatırlatmalar için Hatırlatmalar sayfasına gidebilirsiniz.",
          ]}
        />
      </div>

      {!ready ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          Yükleniyor...
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Bugün randevu" value={randevuBugun.length} />
            <MiniStat label="Bugün eğitim" value={egitimBugun.length} />
            <MiniStat
              label="Gecikmiş görev"
              value={gorevGecikmisListe.length}
              warn={gorevGecikmisListe.length > 0}
            />
            <MiniStat label="Bugün son görev" value={gorevBugunSonListe.length} />
          </div>

          {hatirlatmaOzet.toplam > 0 && (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 size-5 shrink-0 text-amber-800" />
                  <div>
                    <div className="font-medium text-amber-950">
                      {hatirlatmaOzet.toplam} kritik hatırlatma
                    </div>
                    <p className="text-sm text-amber-900/80">
                      Soğuyan ilişki: {hatirlatmaOzet.soguyan}, süreç tıkanması:{" "}
                      {hatirlatmaOzet.tikanma}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 border-amber-300">
                  <Link href="/hatirlatmalar">Hatırlatmalar</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {toplamGunluk === 0 &&
            gorevTarihsizAcik.length === 0 &&
            hatirlatmaOzet.toplam === 0 && (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  Bugün için planlı bir kayıt yok. İyi çalışmalar.
                </CardContent>
              </Card>
            )}

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-purple-700" />
              <h2 className="text-lg font-semibold">Bugünkü randevular</h2>
            </div>
            {randevuBugun.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bugün randevu yok.</p>
            ) : (
              <ul className="space-y-2">
                {randevuBugun.map((r) => (
                  <li key={r.id}>
                    <Card className="border-purple-100">
                      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold">{r.kurum}</div>
                          <div className="text-sm text-muted-foreground">
                            {r.baslangicSaati} – {r.bitisSaati}
                            {r.randevuTipi ? ` · ${r.randevuTipi}` : ""}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {r.durum && (
                            <Badge
                              variant="outline"
                              className={cn(
                                RANDEVU_DURUM_RENKLERI[r.durum] ?? ""
                              )}
                            >
                              {r.durum}
                            </Badge>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/randevular">Randevular</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-purple-700" />
              <h2 className="text-lg font-semibold">Bugünkü eğitimler</h2>
            </div>
            {egitimBugun.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bugün eğitim yok.</p>
            ) : (
              <ul className="space-y-2">
                {egitimBugun.map((e) => (
                  <li key={e.id}>
                    <Card>
                      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold">{e.kurum}</div>
                          <div className="text-sm text-muted-foreground">
                            {e.egitimKonusu}
                            {e.saat ? ` · ${e.saat}` : ""}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{egitimDurum(e)}</Badge>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/egitimler">Eğitimler</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ListTodo className="size-5 text-purple-700" />
              <h2 className="text-lg font-semibold">Görevler (öncelikli)</h2>
            </div>

            {gorevGecikmisListe.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <AlertTriangle className="size-4" />
                  Gecikmiş ({gorevGecikmisListe.length})
                </div>
                <ul className="space-y-2">
                  {gorevGecikmisListe.map((g) => (
                    <GorevSatir key={g.id} gorev={g} vurgu="gecikmis" />
                  ))}
                </ul>
              </div>
            )}

            {gorevBugunSonListe.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Son tarihi bugün ({gorevBugunSonListe.length})
                </p>
                <ul className="space-y-2">
                  {gorevBugunSonListe.map((g) => (
                    <GorevSatir key={g.id} gorev={g} vurgu="bugun" />
                  ))}
                </ul>
              </div>
            )}

            {gorevGecikmisListe.length === 0 && gorevBugunSonListe.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Bugün son tarihli veya gecikmiş açık görev yok.
              </p>
            )}

            {gorevTarihsizAcik.length > 0 && (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Son tarihsiz açık görevler ({gorevTarihsizAcik.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <p className="text-xs text-muted-foreground">
                    Günlük listeye tarih vererek önceliklendirebilirsiniz.
                  </p>
                  <ul className="space-y-2">
                    {gorevTarihsizAcik.slice(0, 8).map((g) => (
                      <GorevSatir key={g.id} gorev={g} vurgu="normal" />
                    ))}
                  </ul>
                  {gorevTarihsizAcik.length > 8 && (
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href="/gorevler">
                        +{gorevTarihsizAcik.length - 8} görev daha (Görevler)
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Button variant="outline" asChild>
              <Link href="/gorevler">Tüm görevler</Link>
            </Button>
          </section>
        </>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border",
        warn && value > 0 && "border-red-200 bg-red-50/50"
      )}
    >
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function GorevSatir({
  gorev,
  vurgu,
}: {
  gorev: Gorev;
  vurgu: "gecikmis" | "bugun" | "normal";
}) {
  const son = gorev.sonTarih
    ? format(gorev.sonTarih.toDate(), "d.MM.yyyy", { locale: tr })
    : null;
  return (
    <li>
      <Card
        className={cn(
          vurgu === "gecikmis" && "border-red-200 bg-red-50/30",
          vurgu === "bugun" && "border-amber-200 bg-amber-50/30"
        )}
      >
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{gorev.baslik}</div>
            {gorev.aciklama && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {gorev.aciklama}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {gorev.gorusmeKurum && <span>{gorev.gorusmeKurum}</span>}
              {son && <span>Son tarih: {son}</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className={GOREV_DURUM_RENKLERI[gorev.durum]}>
              {gorev.durum}
            </Badge>
            <Badge variant="secondary">{gorev.oncelik}</Badge>
            {gorev.gorusmeId ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/kurumlar/${gorev.gorusmeId}`}>Kurum</Link>
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" asChild>
              <Link href="/gorevler">Görevler</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
