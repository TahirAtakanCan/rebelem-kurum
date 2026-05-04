"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";

const menuItems = [
  { href: "/ozet", label: "Özet Panel", icon: LayoutDashboard },
  { href: "/gorusmeler", label: "Görüşmeler", icon: Users },
  { href: "/randevular", label: "Randevular", icon: Calendar },
  { href: "/egitimler", label: "Eğitimler", icon: GraduationCap },
];

/** Mobil sheet ve masaüstü sidebar için ortak menü */
export function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

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
              {item.label}
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
