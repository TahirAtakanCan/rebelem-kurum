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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/gorusmeler" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900 flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <div>
            <div className="font-bold leading-tight">ReBelem</div>
            <div className="text-xs text-muted-foreground">Rehberlik</div>
          </div>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-purple-100 text-purple-900"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
