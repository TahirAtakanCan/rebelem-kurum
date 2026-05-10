"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Snowflake,
  TrendingDown,
  Zap,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpPopover } from "@/components/ui/help-popover";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { useAuth } from "@/components/auth/auth-provider";
import type { Gorusme } from "@/lib/types";
import {
  getKurumDisplayName,
  getResolvedKurumDurumu,
} from "@/lib/kurum-helpers";
import {
  SOGUYAN_ILISKI_GUN_ESIGI,
  ASAMA_TIKANMA_GUN_ESIGI,
  SURECTE_DUSME_GUN_ESIGI,
  HIZLI_MILESTONE_GUN_ARALIK,
  HIZLI_MILESTONE_MIN_SAYISI,
  getSonTemasReferansTarihi,
  listSoguyanIliskiler,
  listAsamalarArasiTikanma,
  listSurectenDusenKurumlar,
  listHizliIlerleyenFirsatlar,
} from "@/lib/hatirlatmalar";

function KurumOzetiSatir({
  kurumHref,
  baslik,
  alt,
}: {
  kurumHref: string;
  baslik: string;
  alt: string;
}) {
  return (
    <Link href={kurumHref} className="block rounded-lg border bg-card px-4 py-3 transition hover:bg-muted">
      <div className="font-semibold">{baslik}</div>
      <p className="mt-1 text-xs text-muted-foreground">{alt}</p>
    </Link>
  );
}

export default function HatirlatmalarPage() {
  const { user } = useAuth();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((data) => {
      setGorusmeler(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const soguyan = useMemo(() => listSoguyanIliskiler(gorusmeler), [gorusmeler]);
  const tikanma = useMemo(
    () => listAsamalarArasiTikanma(gorusmeler),
    [gorusmeler]
  );
  const dusen = useMemo(
    () => listSurectenDusenKurumlar(gorusmeler),
    [gorusmeler]
  );
  const hizli = useMemo(
    () => listHizliIlerleyenFirsatlar(gorusmeler),
    [gorusmeler]
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:gap-8">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Hatırlatmalar</h1>
          <p className="text-muted-foreground">
            İlişkileri sıcak tutmak ve aksayan süreçleri yakalamak için özetlenir.
          </p>
        </div>
        <HelpPopover
          items={[
            `Soğuyan ilişki: Aktif Süreç + son ${SOGUYAN_ILISKI_GUN_ESIGI}+ gün temassız.`,
            `Tıkanma: Son tamamlanan adımdan ${ASAMA_TIKANMA_GUN_ESIGI}+ gün sonra hâlâ bir sonraki adım yapılmamış.`,
            `Düşük ilgi: ${SURECTE_DUSME_GUN_ESIGI}+ gün güncellenmemiş aktif süreç kayıtları.`,
            `Hızlı ilerleyen: Son ${HIZLI_MILESTONE_GUN_ARALIK} günde en az ${HIZLI_MILESTONE_MIN_SAYISI} milestone tamamlanmış pozitif sinyaller.`,
          ]}
          title="Hatırlatma kuralları"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Kurumlar yükleniyor...
        </div>
      ) : gorusmeler.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Kurum kaydı yok; hatırlatma üretmek için önce Kurumlar bölümünden ekleyin.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="soguyan" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted p-2 md:grid-cols-4 md:gap-1">
            <TabsTrigger value="soguyan" className="flex flex-col gap-0.5 py-2 md:flex-row md:gap-2">
              <Snowflake className="size-4 shrink-0" />
              Soğuyan
              <Badge variant="secondary" className="font-mono text-[10px]">
                {soguyan.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tikanma" className="flex flex-col gap-0.5 py-2 md:flex-row md:gap-2">
              <Zap className="size-4 shrink-0" />
              Tıkanma
              <Badge variant="secondary" className="font-mono text-[10px]">
                {tikanma.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="dusen" className="flex flex-col gap-0.5 py-2 md:flex-row md:gap-2">
              <TrendingDown className="size-4 shrink-0" />
              Düşen
              <Badge variant="secondary" className="font-mono text-[10px]">
                {dusen.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="hizli" className="flex flex-col gap-0.5 py-2 md:flex-row md:gap-2">
              <Flame className="size-4 shrink-0" />
              Hızlı
              <Badge variant="secondary" className="font-mono text-[10px]">
                {hizli.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="soguyan" className="mt-4 outline-none">
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Soğuyan ilişkiler
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Aktif Süreç + son temas tarihinden ({SOGUYAN_ILISKI_GUN_ESIGI}+ gün) daha uzun süre iletişim yok (son temassızlıkta son temas tarihi yoksa son güncelleme referans).
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {soguyan.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Şu anda soğuma uyarısı yok — harika görünüyor.
                  </p>
                ) : (
                  soguyan.map((g) => {
                    const gun = differenceInCalendarDays(
                      new Date(),
                      getSonTemasReferansTarihi(g)
                    );
                    const kd = getResolvedKurumDurumu(g);
                    return (
                      <KurumOzetiSatir
                        key={g.id}
                        kurumHref={`/kurumlar/${g.id}`}
                        baslik={getKurumDisplayName(g)}
                        alt={`Son temas yaklaşık ${gun} gün önce — ${kd} · ${g.sehir || "Şehir yok"}`}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tikanma" className="mt-4 outline-none">
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Aşamalar arası tıkanma
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Son tamamlanan adımdan bu yana bir sonraki adım yapılmamış ve en az{" "}
                  {ASAMA_TIKANMA_GUN_ESIGI} gün geçmiş Aktif Süreç kayıtları.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {tikanma.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aşamalarda sıkışma uyarısı yok.
                  </p>
                ) : (
                  tikanma.map((row) => (
                    <KurumOzetiSatir
                      key={row.gorusme.id}
                      kurumHref={`/kurumlar/${row.gorusme.id}`}
                      baslik={getKurumDisplayName(row.gorusme)}
                      alt={`“${row.tamamlananSonAsamaLabel}” (${row.gun} gündür), “${row.bekleyenSonrakiLabel}” yapılmadı · ${row.gorusme.sehir || "Şehir yok"}`}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dusen" className="mt-4 outline-none">
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Süreçten düşen kurumlar
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {SURECTE_DUSME_GUN_ESIGI}+ gündür hiçbir dosya güncellenmemiş; durum Aktif Süreç. Güncellenmemiş olarak duruyor mu yoksa “Kaybedildi / Pasif” mi olmalı, detaydan kontrol edin.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {dusen.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bu filtreye uyan aktif süreç kaydı yok.
                  </p>
                ) : (
                  dusen.map((g) => {
                    const gun = differenceInCalendarDays(
                      new Date(),
                      g.updatedAt.toDate()
                    );
                    return (
                      <KurumOzetiSatir
                        key={g.id}
                        kurumHref={`/kurumlar/${g.id}`}
                        baslik={getKurumDisplayName(g)}
                        alt={`Son güncellenme yaklaşık ${gun} gün önce — ${getResolvedKurumDurumu(g)} · ${g.sehir || "Şehir yok"}`}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hizli" className="mt-4 outline-none">
            <Card className="border border-amber-200/80 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Flame className="size-5 shrink-0 text-orange-600" />
                  Hızlı ilerleyen fırsatlar
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Pozitif sinyal: Son {HIZLI_MILESTONE_GUN_ARALIK} günde minimum{" "}
                  {HIZLI_MILESTONE_MIN_SAYISI} milestone tamamlanmış; momentumu kaçırmayın.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {hizli.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bu aralıkta hızlı ilerleme sinyali yok.
                  </p>
                ) : (
                  hizli.map((row) => (
                    <KurumOzetiSatir
                      key={row.gorusme.id}
                      kurumHref={`/kurumlar/${row.gorusme.id}`}
                      baslik={getKurumDisplayName(row.gorusme)}
                      alt={`🔥 Son ${HIZLI_MILESTONE_GUN_ARALIK} günde ${row.sonBirHaftadaTamamlanan} adım tamamlandı · ${row.gorusme.sehir || "Şehir yok"}`}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
