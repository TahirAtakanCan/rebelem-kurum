import { differenceInCalendarDays, subDays } from "date-fns";
import type { Gorusme, MilestoneTipi } from "./types";
import {
  allMilestonesCompleted,
  getFurthestCompletedMilestoneTip,
  getMilestoneLabel,
  getResolvedKurumDurumu,
  mergeMilestones,
  MILESTONE_TIP_ORDER,
} from "./kurum-helpers";

/** Son temas; yoksa güncelleme, o da yoksa oluşturma. */
export function getSonTemasReferansTarihi(g: Gorusme): Date {
  const ts = g.sonTemasTarihi ?? g.updatedAt ?? g.createdAt;
  return ts.toDate();
}

/** Sadece Aktif Süreç + N+ gün iletişimsiz. */
export const SOGUYAN_ILISKI_GUN_ESIGI = 14;

export function listSoguyanIliskiler(gorusmeler: Gorusme[]): Gorusme[] {
  const now = new Date();
  return gorusmeler.filter((g) => {
    if (getResolvedKurumDurumu(g) !== "Aktif Süreç") return false;
    const ref = getSonTemasReferansTarihi(g);
    return differenceInCalendarDays(now, ref) >= SOGUYAN_ILISKI_GUN_ESIGI;
  });
}

export const ASAMA_TIKANMA_GUN_ESIGI = 21;

export interface AsamaTikanmaSatir {
  gorusme: Gorusme;
  tamamlananSonAsama: MilestoneTipi;
  tamamlananSonAsamaLabel: string;
  bekleyenSonrakiLabel: string;
  gun: number;
}

export function listAsamalarArasiTikanma(
  gorusmeler: Gorusme[]
): AsamaTikanmaSatir[] {
  const now = new Date();
  const out: AsamaTikanmaSatir[] = [];
  for (const g of gorusmeler) {
    if (getResolvedKurumDurumu(g) !== "Aktif Süreç") continue;
    if (allMilestonesCompleted(g.milestones)) continue;
    const furthest = getFurthestCompletedMilestoneTip(g.milestones);
    if (!furthest) continue;
    const idx = MILESTONE_TIP_ORDER.indexOf(furthest);
    const nextTip = MILESTONE_TIP_ORDER[idx + 1];
    if (!nextTip) continue;
    const merged = mergeMilestones(g.milestones);
    const m = merged.find((x) => x.tip === furthest);
    if (!m?.tamamlanmaTarihi) continue;
    const nextM = merged.find((x) => x.tip === nextTip);
    if (nextM?.tamamlandi) continue;
    const gun = differenceInCalendarDays(now, m.tamamlanmaTarihi.toDate());
    if (gun < ASAMA_TIKANMA_GUN_ESIGI) continue;
    out.push({
      gorusme: g,
      tamamlananSonAsama: furthest,
      tamamlananSonAsamaLabel: getMilestoneLabel(furthest),
      bekleyenSonrakiLabel: getMilestoneLabel(nextTip),
      gun,
    });
  }
  return out.sort((a, b) => b.gun - a.gun);
}

export const SURECTE_DUSME_GUN_ESIGI = 30;

/** Aktif Süreç; uzun süredir güncellenmemiş. */
export function listSurectenDusenKurumlar(gorusmeler: Gorusme[]): Gorusme[] {
  const now = new Date();
  return gorusmeler.filter((g) => {
    if (getResolvedKurumDurumu(g) !== "Aktif Süreç") return false;
    return (
      differenceInCalendarDays(now, g.updatedAt.toDate()) >=
      SURECTE_DUSME_GUN_ESIGI
    );
  });
}

export const HIZLI_MILESTONE_GUN_ARALIK = 7;
export const HIZLI_MILESTONE_MIN_SAYISI = 2;

export interface HizliIlerleyenSatir {
  gorusme: Gorusme;
  sonBirHaftadaTamamlanan: number;
}

export function listHizliIlerleyenFirsatlar(
  gorusmeler: Gorusme[]
): HizliIlerleyenSatir[] {
  const esikBas = subDays(new Date(), HIZLI_MILESTONE_GUN_ARALIK);
  const out: HizliIlerleyenSatir[] = [];
  for (const g of gorusmeler) {
    if (getResolvedKurumDurumu(g) !== "Aktif Süreç") continue;
    const merged = mergeMilestones(g.milestones);
    let cnt = 0;
    for (const m of merged) {
      if (!m.tamamlandi || !m.tamamlanmaTarihi) continue;
      if (m.tamamlanmaTarihi.toDate() >= esikBas) cnt++;
    }
    if (cnt >= HIZLI_MILESTONE_MIN_SAYISI) {
      out.push({ gorusme: g, sonBirHaftadaTamamlanan: cnt });
    }
  }
  return out.sort((a, b) => b.sonBirHaftadaTamamlanan - a.sonBirHaftadaTamamlanan);
}

export function kritikHatirlatmaOzetSayisi(gorusmeler: Gorusme[]): {
  soguyan: number;
  tikanma: number;
  toplam: number;
} {
  const soguyan = listSoguyanIliskiler(gorusmeler).length;
  const tikanma = listAsamalarArasiTikanma(gorusmeler).length;
  return {
    soguyan,
    tikanma,
    toplam: soguyan + tikanma,
  };
}
