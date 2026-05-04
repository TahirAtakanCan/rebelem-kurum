"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gorusme, Randevu, Egitim } from "@/lib/types";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { subscribeRandevular } from "@/lib/randevular";
import { subscribeEgitimler } from "@/lib/egitimler";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Users,
  TrendingUp,
  Calendar,
  GraduationCap,
  CircleCheck,
  CircleX,
  CircleHelp,
  Clock,
  Wallet,
} from "lucide-react";
import { isToday, isThisWeek, isThisMonth } from "date-fns";

export default function OzetPage() {
  const { user } = useAuth();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [egitimler, setEgitimler] = useState<Egitim[]>([]);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeGorusmeler(setGorusmeler);
    const u2 = subscribeRandevular(setRandevular);
    const u3 = subscribeEgitimler(setEgitimler);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  // Görüşme istatistikleri
  const toplamKurum = gorusmeler.length;
  const satinAlan = gorusmeler.filter((g) => g.satisDurumu === "Satın Aldı").length;
  const satinAlmayan = gorusmeler.filter((g) => g.satisDurumu === "Satın Almadı").length;
  const kararsiz = gorusmeler.filter((g) => g.satisDurumu === "Kararsız").length;
  const surecDevam = gorusmeler.filter(
    (g) => !g.satisDurumu || g.satisDurumu === "Beklemede"
  ).length;
  const donusumOrani =
    toplamKurum > 0 ? Math.round((satinAlan / toplamKurum) * 100) : 0;

  // Randevu istatistikleri
  const bugunR = randevular.filter((r) => isToday(r.tarih.toDate())).length;
  const buHaftaR = randevular.filter((r) =>
    isThisWeek(r.tarih.toDate(), { weekStartsOn: 1 })
  ).length;
  const buAyR = randevular.filter((r) => isThisMonth(r.tarih.toDate())).length;

  // Eğitim istatistikleri
  const toplamEgitim = egitimler.length;
  const toplamKatilimci = egitimler.reduce(
    (sum, e) => sum + (e.katilimciSayisi || 0),
    0
  );
  const toplamSaat = egitimler.reduce((sum, e) => sum + (e.sureSaat || 0), 0);
  const toplamCiro = egitimler.reduce((sum, e) => sum + (e.ucret || 0), 0);
  const tahsilEdilen = egitimler
    .filter((e) => e.tahsilatDurumu === "Tahsil Edildi")
    .reduce((sum, e) => sum + (e.ucret || 0), 0);
  const bekleyenTahsilat = toplamCiro - tahsilEdilen;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Özet Panel</h1>
        <p className="text-muted-foreground">Genel durum özeti</p>
      </div>

      {/* Görüşme İstatistikleri */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          📞 Görüşme İstatistikleri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Toplam Kurum"
            value={toplamKurum}
            icon={<Users className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            label="Satın Alan"
            value={satinAlan}
            icon={<CircleCheck className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Satın Almayan"
            value={satinAlmayan}
            icon={<CircleX className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            label="Kararsız"
            value={kararsiz}
            icon={<CircleHelp className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            label="Süreç Devam"
            value={surecDevam}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Dönüşüm Oranı"
            value={`%${donusumOrani}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="indigo"
          />
        </div>
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
            label="Toplam Eğitim"
            value={toplamEgitim}
            icon={<GraduationCap className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Katılımcı"
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
          <StatCard
            label="Toplam Ciro"
            value={`₺${toplamCiro.toLocaleString("tr-TR")}`}
            icon={<Wallet className="w-5 h-5" />}
            color="indigo"
          />
          <StatCard
            label="Tahsil Edilen"
            value={`₺${tahsilEdilen.toLocaleString("tr-TR")}`}
            icon={<CircleCheck className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Bekleyen Tahsilat"
            value={`₺${bekleyenTahsilat.toLocaleString("tr-TR")}`}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
        </div>
      </section>
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
};

function StatCard({
  label,
  value,
  icon,
  color,
  big = false,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  big?: boolean;
}) {
  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium opacity-80">{label}</CardTitle>
        <div className="opacity-70">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={big ? "text-4xl font-bold" : "text-2xl font-bold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
