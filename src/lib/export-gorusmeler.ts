import type { Gorusme } from "./types";
import {
  countCompletedMilestones,
  getAnaKisiAd,
  getKurumDisplayName,
  getResolvedKurumDurumu,
  MILESTONE_TIP_ORDER,
} from "./kurum-helpers";

function escCell(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportGorusmelerToCsv(gorusmeler: Gorusme[], filename = "kurumlar-export.csv") {
  const headers = [
    "Kurum Adı",
    "Şehir",
    "İlçe",
    "Tahmini Değer TL",
    "Etiketler",
    "Kişi Sayısı",
    "Tamamlanan Milestone",
    "Kurum Durumu",
    "Web",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Ana Kişi",
    "Ana Telefon",
    "Ana Mail",
    "Kurum Tipi",
    "İletişime Geçen",
    "Eski Durum",
    "Öncelik",
    "Konumu",
    "Aracı",
    "Satış Durumu (legacy)",
    "Satır Notu",
    "ID",
  ];

  const lines = [headers.map(escCell).join(",")];

  for (const g of gorusmeler) {
    const ana = g.kisiler?.[0];
    const row = [
      getKurumDisplayName(g),
      g.sehir || "",
      g.ilce || "",
      g.tahminiDeger ?? "",
      (g.etiketler || []).join("; "),
      g.kisiler?.length ?? 0,
      `${countCompletedMilestones(g.milestones)}/${MILESTONE_TIP_ORDER.length}`,
      getResolvedKurumDurumu(g),
      g.webSitesi || "",
      g.instagram || "",
      g.facebook || "",
      g.linkedin || "",
      getAnaKisiAd(g),
      ana?.telefon || g.iletisimNo || "",
      ana?.email || g.mail || "",
      g.kurumTipi || "",
      g.iletisimeGecen || "",
      g.durum || "",
      g.oncelik || "",
      g.konumu || "",
      g.araci || "",
      g.satisDurumu || "",
      g.not || "",
      g.id,
    ];
    lines.push(row.map((c) => escCell(c as string | number)).join(","));
  }

  const blob = new Blob(["\ufeff", lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
