import type { Gorusme } from "./types";
import { getAnaKisiAd, getKurumDisplayName } from "./kurum-helpers";

/** Türkçe uyumlu: küçük harf + aksanların sadeleştirilmesi (ş≈s, ğ≈g gibi). */
export function normalizeText(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");
}

/** Arama kutusu için: tokenlar hepsinin oluşması gerekmez; herhangi biri substring eşlesir. */
export function tokenizeQuery(q: string): string[] {
  return normalizeText(q)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

function normalizeCompact(s: string): string {
  return normalizeText(s).replace(/\s/g, "");
}

function kurumContactHaystack(g: Gorusme): string {
  const chunks: string[] = [
    getKurumDisplayName(g),
    g.ad || "",
    g.kurum || "",
    g.sehir || "",
    g.ilce || "",
    g.ilgiliKisi || "",
    getAnaKisiAd(g),
    g.iletisimNo || "",
    g.mail || "",
    ...(g.etiketler || []),
    ...(g.kisiler?.flatMap((k) => [k.ad, k.rol, k.telefon, k.email]) || []).filter(Boolean) as string[],
  ];

  const raw = chunks.join("\n");

  /* Hem ham hem normalize edilmiş sürüm için eşleme */
  return `${raw}\n${normalizeText(raw)}\n${normalizeCompact(raw)}`;
}

export function gorusmeMatchesSearch(g: Gorusme, queryRaw: string): boolean {
  const tokens = tokenizeQuery(queryRaw);
  if (tokens.length === 0) return true;
  const hay = kurumContactHaystack(g).toLocaleLowerCase("tr");

  /* Token başına haystack içinde arama — normalize ile */
  const hayNorm = hay + "\n" + normalizeText(hay);

  return tokens.every(
    (t) =>
      hayNorm.includes(t) ||
      normalizeText(hay).includes(normalizeText(t)) ||
      normalizeCompact(hay).includes(normalizeCompact(t))
  );
}

function levenshtein(a: string, b: string): number {
  if (a.length < b.length) return levenshtein(b, a);
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Kayıt öncesi: çok yakın ada sahip başka kurum var mı?
 * Basit küçük-büyük içerme + kısa stringler için Levenshtein.
 */
export function findDuplicateKurumCandidate(
  candidateName: string,
  all: Gorusme[],
  excludeId?: string
): Gorusme | null {
  const c = normalizeCompact(candidateName.trim());
  if (c.length < 3) return null;

  for (const g of all) {
    if (excludeId && g.id === excludeId) continue;
    const gn = normalizeCompact(getKurumDisplayName(g));
    if (gn.length < 3) continue;
    if (c === gn) return g;
    if (
      Math.max(c.length, gn.length) >= 4 &&
      (c.includes(gn) || gn.includes(c))
    ) {
      return g;
    }
    if (
      c.length <= 40 &&
      gn.length <= 40 &&
      Math.abs(c.length - gn.length) <= 2
    ) {
      if (levenshtein(c, gn) <= 2) return g;
    }
  }
  return null;
}
