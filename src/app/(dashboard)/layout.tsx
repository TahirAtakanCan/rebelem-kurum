"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopSidebar, SidebarNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/auth/auth-provider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { subscribeGorevler } from "@/lib/gorevler";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { kritikHatirlatmaOzetSayisi } from "@/lib/hatirlatmalar";
import { endOfDay, format, isBefore, isToday } from "date-fns";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorevler((data) => {
      if (typeof window === "undefined") return;
      const shown = sessionStorage.getItem("tasksAlertShown");
      if (shown) return;

      const todayEnd = endOfDay(new Date());
      const dueCount = data.filter((g) => {
        if (g.durum === "Tamamlandı" || !g.sonTarih) return false;
        const due = g.sonTarih.toDate();
        return isToday(due) || isBefore(due, todayEnd);
      }).length;

      if (dueCount > 0) {
        sessionStorage.setItem("tasksAlertShown", "true");
        toast(`${dueCount} görevin son tarihi geldi/geçti`, {
          action: {
            label: "Görüntüle",
            onClick: () => router.push("/gorevler"),
          },
        });
      }
    });
    return () => unsub();
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorusmeler((gorusmeler) => {
      if (typeof window === "undefined") return;
      const gun = format(new Date(), "yyyy-MM-dd");
      const flag = `rebelem_kritik_hatirlatma_toast_${gun}`;
      if (sessionStorage.getItem(flag)) return;
      const { soguyan, tikanma, toplam } =
        kritikHatirlatmaOzetSayisi(gorusmeler);
      if (toplam <= 0) return;
      sessionStorage.setItem(flag, "1");
      const parca: string[] = [];
      if (soguyan > 0) parca.push(`${soguyan} soğuyan ilişki`);
      if (tikanma > 0) parca.push(`${tikanma} süreç tıkanması`);
      toast.warning(
        `Önemli: ${toplam} kritik hatırlatma (${parca.join(", ")}).`,
        {
          duration: 12_000,
          action: {
            label: "Hatırlatmalar",
            onClick: () => router.push("/hatirlatmalar"),
          },
        }
      );
    });
    return () => unsub();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="flex w-[min(100vw-2rem,20rem)] max-w-[85vw] flex-col border-r bg-white p-0 sm:max-w-sm"
        >
          <SidebarNav onLinkClick={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
