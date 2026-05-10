"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Building2,
} from "lucide-react";
import { subscribeGorevler } from "@/lib/gorevler";
import { useAuth } from "@/components/auth/auth-provider";

const menuItems = [
  { href: "/ozet", label: "Özet Panel", icon: LayoutDashboard },
  { href: "/gorusmeler", label: "Kurumlar", icon: Building2 },
  { href: "/randevular", label: "Randevular", icon: Calendar },
  { href: "/egitimler", label: "Eğitimler", icon: GraduationCap },
  { href: "/gorevler", label: "Görevler", icon: ListTodo },
];

/** Mobil sheet ve masaüstü sidebar için ortak menü */
export function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [aktifGorevSayisi, setAktifGorevSayisi] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGorevler((data) => {
      const aktif = data.filter((g) => g.durum !== "Tamamlandı").length;
      setAktifGorevSayisi(aktif);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 border-b p-6">
        <Link
          href="/gorusmeler"
          className="flex items-center gap-3"
          onClick={onLinkClick}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-900 text-lg font-bold text-white">
            R
          </div>
          <div className="min-w-0">
            <div className="font-bold leading-tight">ReBelem</div>
            <div className="text-xs text-muted-foreground">Rehberlik</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-purple-100 text-purple-900"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex flex-1 items-center justify-between gap-2">
                {item.label}
                {item.href === "/gorevler" && aktifGorevSayisi > 0 && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-900">
                    {aktifGorevSayisi}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Masaüstü: sabit sol sidebar */
export function DesktopSidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-white md:flex md:flex-col">
      <SidebarNav />
    </aside>
  );
}
