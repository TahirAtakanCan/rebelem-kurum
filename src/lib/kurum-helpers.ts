import { Timestamp } from "firebase/firestore";
import type {
  Gorusme,
  KurumDurumu,
  KurumKisi,
  KurumMilestone,
  MilestoneTipi,
} from "./types";

/** Sabit milestone sırası — pipeline istatistikleri ve birleştirme için. */
export const MILESTONE_TIP_ORDER: MilestoneTipi[] = [
  "ilk_iletisim",
  "tanisma_gorusmesi",
  "tanitim_sunum",
  "egitim_takvimi",
  "kurum_hesabi",
  "ilk_egitim",
  "aktif_kullanim",
];

const TIP_INDEX = new Map(MILESTONE_TIP_ORDER.map((t, i) => [t, i]));

export function getKurumDisplayName(g: Pick<Gorusme, "ad" | "kurum">): string {
  const s = (g.ad || g.kurum || "").trim();
  return s || "İsimsiz";
}

export function getResolvedKurumDurumu(g: Gorusme): KurumDurumu {
  if (g.kurumDurumu) return g.kurumDurumu;
  if (g.satisDurumu === "Satın Aldı") return "Kazanıldı";
  if (g.satisDurumu === "Satın Almadı") return "Kaybedildi";
  return "Aktif Süreç";
}

/** Eksik tipleri tamamla; her tip tek satır. */
export function mergeMilestones(existing?: KurumMilestone[]): KurumMilestone[] {
  const byTip = new Map((existing || []).map((m) => [m.tip, { ...m }]));
  return MILESTONE_TIP_ORDER.map((tip) => {
    const cur = byTip.get(tip);
    return cur ?? { tip, tamamlandi: false };
  });
}

export function countCompletedMilestones(milestones?: KurumMilestone[]): number {
  return mergeMilestones(milestones).filter((m) => m.tamamlandi).length;
}

/** Tamamlanan adımlar arasında en yüksek indeksli tip (sıra zorunlu değil). */
export function getFurthestCompletedMilestoneTip(
  milestones?: KurumMilestone[]
): MilestoneTipi | null {
  const merged = mergeMilestones(milestones);
  let bestIdx = -1;
  let best: MilestoneTipi | null = null;
  for (const m of merged) {
    if (!m.tamamlandi) continue;
    const idx = TIP_INDEX.get(m.tip);
    if (idx === undefined) continue;
    if (idx > bestIdx) {
      bestIdx = idx;
      best = m.tip;
    }
  }
  return best;
}

export function milestoneProgressLabel(milestones?: KurumMilestone[]): string {
  const done = countCompletedMilestones(milestones);
  return `${done}/${MILESTONE_TIP_ORDER.length}`;
}

export function milestoneCompletionPercent(milestones?: KurumMilestone[]): number {
  if (MILESTONE_TIP_ORDER.length === 0) return 0;
  return Math.round((countCompletedMilestones(milestones) / MILESTONE_TIP_ORDER.length) * 100);
}

export function averageMilestoneCompletionPercent(gorusmeler: Gorusme[]): number {
  if (!gorusmeler.length) return 0;
  let sum = 0;
  for (const g of gorusmeler) {
    sum += milestoneCompletionPercent(g.milestones);
  }
  return Math.round(sum / gorusmeler.length);
}

/** Dialog / liste: birincil iletişim. */
export function getAnaKisiAd(g: Gorusme): string {
  return g.kisiler?.[0]?.ad?.trim() || g.ilgiliKisi?.trim() || "-";
}

export function getAnaKisiTelefon(g: Gorusme): string {
  return g.kisiler?.[0]?.telefon?.trim() || g.iletisimNo?.trim() || "-";
}

export function formatEtiketlerPreview(
  etiketler: string[] | undefined,
  maxShow = 2
): { shown: string[]; rest: number } {
  const list = etiketler?.filter(Boolean) || [];
  const shown = list.slice(0, maxShow);
  const rest = Math.max(0, list.length - shown.length);
  return { shown, rest };
}

/** Kayıtta: ad ve kurum birlikte; birincil kişiden legacy iletişim alanları. */
export function buildGorusmeSyncPayload(params: {
  ad: string;
  kisiler?: KurumKisi[];
}): {
  ad: string;
  kurum: string;
  ilgiliKisi?: string;
  iletisimNo?: string;
  mail?: string;
} {
  const name = params.ad.trim();
  const first = params.kisiler?.[0];
  return {
    ad: name,
    kurum: name,
    ...(first?.ad?.trim() ? { ilgiliKisi: first.ad.trim() } : {}),
    ...(first?.telefon?.trim() ? { iletisimNo: first.telefon.trim() } : {}),
    ...(first?.email?.trim() ? { mail: first.email.trim() } : {}),
  };
}

export function kurumDurumuToSatis(
  kd: KurumDurumu | undefined
): "Satın Aldı" | "Satın Almadı" | undefined {
  if (!kd) return undefined;
  if (kd === "Kazanıldı") return "Satın Aldı";
  if (kd === "Kaybedildi") return "Satın Almadı";
  return undefined;
}

export function initialKisilerFromGorusme(gorusme: Gorusme | null | undefined): KurumKisi[] {
  if (!gorusme) return [];
  if (gorusme.kisiler?.length) {
    return gorusme.kisiler.map((k) => ({
      ...k,
      id: k.id || crypto.randomUUID(),
    }));
  }
  if (gorusme.ilgiliKisi || gorusme.iletisimNo || gorusme.mail) {
    return [
      {
        id: crypto.randomUUID(),
        ad: gorusme.ilgiliKisi || "",
        telefon: gorusme.iletisimNo || "",
        email: gorusme.mail || "",
      },
    ];
  }
  return [];
}

export function milestoneTimestampNow(): Timestamp {
  return Timestamp.fromDate(new Date());
}
