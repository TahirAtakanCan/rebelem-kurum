"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import {
  Aktivite,
  Gorusme,
  Randevu,
  Egitim,
  EgitimDurumu,
  Gorev,
} from "@/lib/types";
import { subscribeSonAktiviteler } from "@/lib/aktivite";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { MILESTONE_TIPLERI } from "@/lib/constants";
import {
  averageMilestoneCompletionPercent,
  getFurthestCompletedMilestoneTip,
  getResolvedKurumDurumu,
  pipelineTamamlamaAraligiGun,
} from "@/lib/kurum-helpers";
import { subscribeRandevular } from "@/lib/randevular";
import { subscribeEgitimler } from "@/lib/egitimler";
import { subscribeGorevler } from "@/lib/gorevler";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Users,
  TrendingUp,
  Calendar,
  GraduationCap,
  CheckCircle2,
  ListTodo,
  CircleCheck,
  CircleX,
  Clock,
  AlertTriangle,
  Activity,
  HeartPulse,
} from "lucide-react";
import { endOfDay, isBefore, isToday, isThisWeek, isThisMonth } from "date-fns";

export default function OzetPage() {
  const { user } = useAuth();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [egitimler, setEgitimler] = useState<Egitim[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [aktiviteler, setAktiviteler] = useState<Aktivite[]>([]);
  const [aktiviteHazir, setAktiviteHazir] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeGorusmeler(setGorusmeler);
    const u2 = subscribeRandevular(setRandevular);
    const u3 = subscribeEgitimler(setEgitimler);
    const u4 = subscribeGorevler(setGorevler);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeSonAktiviteler((rows) => {
      setAktiviteler(rows);
      setAktiviteHazir(true);
    }, 10);
    return () => unsub();
  }, [user]);

  const toplamKurum = gorusmeler.length;
  const aktifSurecte = gorusmeler.filter(
    (g) => getResolvedKurumDurumu(g) === "Aktif Süreç"
  ).length;
  const kazanildi = gorusmeler.filter(
    (g) => getResolvedKurumDurumu(g) === "Kazanıldı"
  ).length;
  const kaybedildi = gorusmeler.filter(
    (g) => getResolvedKurumDurumu(g) === "Kaybedildi"
  ).length;
  const ortalamaMilestonePct = averageMilestoneCompletionPercent(gorusmeler);

  const pipeline = useMemo(() => {
    type Tip = (typeof MILESTONE_TIPLERI)[number]["tip"];
    const byTip = {} as Record<Tip, number>;
    for (const row of MILESTONE_TIPLERI) byTip[row.tip] = 0;
    let henuzYok = 0;
    for (const g of gorusmeler) {
      const furthest = getFurthestCompletedMilestoneTip(g.milestones);
      if (furthest === null) henuzYok++;
      else byTip[furthest]++;
    }
    return { byTip, henuzYok };
  }, [gorusmeler]);

  const maxPipelineBar = Math.max(
    pipeline.henuzYok,
    ...Object.values(pipeline.byTip),
    1
  );

  const pipelineSagligiYuzdesi =
    toplamKurum > 0
      ? Math.round((aktifSurecte / toplamKurum) * 100)
      : 0;

  const ortPipelineKazanilanGun = useMemo(() => {
    const kazanilanlar = gorusmeler.filter(
      (g) => getResolvedKurumDurumu(g) === "Kazanıldı"
    );
    const spans = kazanilanlar
      .map((g) => pipelineTamamlamaAraligiGun(g.milestones))
      .filter((x): x is number => x != null && x >= 0);
    if (!spans.length) return null;
    return Math.round(
      spans.reduce((a, b) => a + b, 0) / spans.length
    );
  }, [gorusmeler]);

  const buHaftaKazanilan = useMemo(() => {
    return gorusmeler.filter((g) => {
      if (getResolvedKurumDurumu(g) !== "Kazanıldı") return false;
      return isThisWeek(g.updatedAt.toDate(), { weekStartsOn: 1 });
    }).length;
  }, [gorusmeler]);

  const buAyKazanilan = useMemo(() => {
    return gorusmeler.filter((g) => {
      if (getResolvedKurumDurumu(g) !== "Kazanıldı") return false;
      return isThisMonth(g.updatedAt.toDate());
    }).length;
  }, [gorusmeler]);

  // Randevu istatistikleri
  const bugunR = randevular.filter((r) => isToday(r.tarih.toDate())).length;
  const buHaftaR = randevular.filter((r) =>
    isThisWeek(r.tarih.toDate(), { weekStartsOn: 1 })
  ).length;
  const buAyR = randevular.filter((r) => isThisMonth(r.tarih.toDate())).length;

  // Eğitim istatistikleri
  const toplamEgitim = egitimler.length;
  const getDurum = (e: Egitim): EgitimDurumu => e.egitimDurumu || "Tamamlandı";
  const planlananEgitim = egitimler.filter((e) => getDurum(e) === "Planlandı").length;
  const tamamlananEgitim = egitimler.filter((e) => getDurum(e) === "Tamamlandı").length;
  const buAyEgitimler = egitimler.filter((e) => {
    const durum = getDurum(e);
    if (durum !== "Planlandı" && durum !== "Tamamlandı") return false;
    return isThisMonth(e.tarih.toDate());
  }).length;
  const toplamKatilimci = egitimler.reduce(
    (sum, e) => sum + (e.katilimciSayisi || 0),
    0
  );
  const toplamSaat = egitimler.reduce((sum, e) => sum + (e.sureSaat || 0), 0);

  // Görev istatistikleri
  const bekleyenGorev = gorevler.filter((g) => g.durum === "Bekliyor").length;
  const yapiliyorGorev = gorevler.filter((g) => g.durum === "Yapılıyor").length;
  const bugunBitmeli = gorevler.filter((g) => {
    if (g.durum === "Tamamlandı" || !g.sonTarih) return false;
    const due = g.sonTarih.toDate();
    return isToday(due) || isBefore(due, endOfDay(new Date()));
  }).length;
  const buHaftaTamamlanan = gorevler.filter((g) => {
    if (!g.tamamlandiTarihi) return false;
    return isThisWeek(g.tamamlandiTarihi.toDate(), { weekStartsOn: 1 });
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Özet Panel</h1>
          <p className="text-muted-foreground">Genel durum özeti</p>
        </div>
        <HelpPopover
          items={[
            "Veriler anlık olarak güncellenir.",
            "Renkler durumları özetler, kartlar tıklanabilir değildir.",
            "Görevler bölümündeki uyarı, günü geçen işleri gösterir.",
            "Detay için ilgili sayfaya sol menüden geç.",
          ]}
        />
      </div>

      {/* Kurum istatistikleri */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          🏛️ Kurum İstatistikleri
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Toplam {toplamKurum} kurum</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Aktif Süreçte"
            value={aktifSurecte}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Kazanıldı"
            value={kazanildi}
            icon={<CircleCheck className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Kaybedildi"
            value={kaybedildi}
            icon={<CircleX className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            label="Tamamlanma Oranı"
            value={`%${ortalamaMilestonePct}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="indigo"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          📊 Pipeline (son tamamlanan adım)
        </h2>
        <Card className="border">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Her kurum, tamamlanan en ileri milestone sütununa sayılır. Henüz adım işaretlenmemiş
              kurumlar ayrı gösterilir.
            </p>
            <PipelineRow
              label="Henüz adım yok"
              count={pipeline.henuzYok}
              max={maxPipelineBar}
            />
            {MILESTONE_TIPLERI.map((m) => (
              <PipelineRow
                key={m.tip}
                label={m.label}
                count={pipeline.byTip[m.tip]}
                max={maxPipelineBar}
              />
            ))}
            <div className="border-t pt-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pipeline özeti — metrikler
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Pipeline sağlığı"
                  value={`%${pipelineSagligiYuzdesi}`}
                  icon={<HeartPulse className="size-5" />}
                  color="green"
                />
                <StatCard
                  label="Ort. pipeline süresi"
                  value={
                    ortPipelineKazanilanGun != null
                      ? `${ortPipelineKazanilanGun} gün`
                      : "—"
                  }
                  icon={<TrendingUp className="size-5" />}
                  color="blue"
                  hint="Kazanıldı olanlar için ilk işaretlenen ile son işaretlenen milestone arasında geçen gün."
                />
                <StatCard
                  label="Bu hafta kazanıldı"
                  value={buHaftaKazanilan}
                  icon={<CircleCheck className="size-5" />}
                  color="purple"
                  hint="Kriter: kurum updatedAt tarihi son 7 güne düşüyorsa."
                />
                <StatCard
                  label="Bu ay kazanıldı"
                  value={buAyKazanilan}
                  icon={<CircleCheck className="size-5" />}
                  color="yellow"
                  hint="Kriter: kurum updatedAt tarihi bu ay içindeyse."
                />
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Pipeline sağlığı: Aktif Süreçte olanların toplam kuruma oranı; yüksek
                pay iş girişi açısından genelde daha iyi. Ortalama pipeline süresi:
                Kazanıldı olarak işaretlenen kayıtlar için ilk işaretlenen milestone
                ile son işaretlenen arasında geçen günün ortalaması (hedefe göre elle
                yorumlar).
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          ⚡ Son aktiviteler
        </h2>
        <Card className="border">
          <CardContent className="p-6">
            {!aktiviteHazir ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : aktiviteler.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz gösterilecek aktivite kaydı yok — milestone işaretleme veya yeni randevu eğitim ekledikçe görünür (Firestore koleksiyonu: aktiviteler).
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {aktiviteler.map((a) => {
                  const href = a.ilgiliId
                    ? `/kurumlar/${a.ilgiliId}`
                    : null;
                  const zaman =
                    a.createdAt && "toDate" in a.createdAt && a.createdAt
                      ? formatDistanceToNow(a.createdAt.toDate(), {
                          locale: tr,
                          addSuffix: true,
                        })
                      : null;
                  return (
                    <li key={a.id} className="flex gap-3 py-4 first:pt-0">
                      <Activity className="mt-1 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1 text-sm leading-relaxed">
                        <span className="text-foreground">{a.mesaj}</span>
                        {zaman ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({zaman})
                          </span>
                        ) : null}
                        {href ? (
                          <>
                            {" "}
                            <Link
                              href={href}
                              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Kuruma git
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Randevular */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">📅 Randevular</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Bugün"
            value={bugunR}
            icon={<Calendar className="w-5 h-5" />}
            color="yellow"
            big
          />
          <StatCard
            label="Bu Hafta"
            value={buHaftaR}
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
            big
          />
          <StatCard
            label="Bu Ay"
            value={buAyR}
            icon={<Calendar className="w-5 h-5" />}
            color="purple"
            big
          />
        </div>
      </section>

      {/* Eğitimler */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          🎓 Eğitim İstatistikleri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Planlanmış Eğitim"
            value={planlananEgitim}
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Tamamlanan Eğitim"
            value={tamamlananEgitim}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Bu Ayki Eğitimler"
            value={buAyEgitimler}
            icon={<GraduationCap className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            label="Toplam Eğitim"
            value={toplamEgitim}
            icon={<GraduationCap className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Toplam Katılımcı"
            value={toplamKatilimci}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Toplam Saat"
            value={toplamSaat}
            icon={<Clock className="w-5 h-5" />}
            color="purple"
          />
        </div>
      </section>

      {/* Görevler */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          📋 Görevler
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Bekliyor"
            value={bekleyenGorev}
            icon={<ListTodo className="w-5 h-5" />}
            color="gray"
          />
          <StatCard
            label="Yapılıyor"
            value={yapiliyorGorev}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Bugün Bitmesi Lazım"
            value={bugunBitmeli}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            label="Bu Hafta Tamamlandı"
            value={buHaftaTamamlanan}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
        </div>
      </section>
    </div>
  );
}

function PipelineRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm gap-4">
        <span className="min-w-0 font-medium">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-purple-600 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const colorClasses: Record<string, string> = {
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  gray: "bg-gray-50 text-gray-700 border-gray-200",
};

function StatCard({
  label,
  value,
  icon,
  color,
  big = false,
  hint,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  big?: boolean;
  hint?: string;
}) {
  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardHeader className="flex flex-col gap-1 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <CardTitle className="min-w-0 truncate text-xs font-medium whitespace-nowrap opacity-80 sm:pr-2 md:text-sm">
          {label}
        </CardTitle>
        <div className="hidden shrink-0 opacity-70 sm:flex sm:items-center">{icon}</div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div
          className={
            big
              ? "text-3xl font-bold md:text-4xl"
              : "text-xl font-bold md:text-2xl"
          }
        >
          {value}
        </div>
        {hint ? (
          <p className="text-[11px] leading-snug opacity-85">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
