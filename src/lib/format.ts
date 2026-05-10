function blocks10(d: string): string {
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

/** Sadece rakam; tam 10→0533 …; tam 11 ve 0’lı→bloklar; daha kısaysa kademeli bloklar (yazarken). */
export function formatPhone(value: string): string {
  let d = value.replace(/\D/g, "");

  if (d.startsWith("90") && d.length >= 12) d = d.slice(2);

  if (d.length === 11 && d.startsWith("0")) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  }
  if (d.length === 10) {
    return `0${blocks10(d)}`;
  }

  if (!d.startsWith("0")) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    if (d.length < 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `0${blocks10(d)}`;
  }

  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length <= 9) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (d.length < 11) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;

  return d;
}

type SocialKind = "instagram" | "facebook" | "linkedin";

function stripTrailingPath(s: string): string {
  return s.replace(/\/+$/, "").trim();
}

/** Kayıtta saklanacak: yalın kullanıcı adı / slug (tam URL içinden çıkarım). */
export function normalizeSocialForStore(raw: string, kind: SocialKind): string {
  let s = raw.trim();
  if (!s) return "";

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      s = u.pathname + u.search + u.hash;
      if (u.hostname.toLowerCase().includes("linkedin.com")) {
        const m = s.match(/\/(?:in|company)\/([^/?#]+)/i);
        if (m) return decodeURIComponent(m[1]);
      }
      if (
        kind === "facebook" &&
        u.hostname.toLowerCase().includes("facebook.com")
      ) {
        const parts = stripTrailingPath(u.pathname).split("/").filter(Boolean);
        if (parts.length) return decodeURIComponent(parts[parts.length - 1]);
      }
      if (
        kind === "instagram" &&
        u.hostname.toLowerCase().includes("instagram.com")
      ) {
        const parts = stripTrailingPath(u.pathname).split("/").filter(Boolean);
        if (parts.length) return parts[0].replace(/^@/, "");
      }
      s = stripTrailingPath(s);
    } catch {
      s = s.replace(/^https?:\/\//i, "");
    }
  }

  s = s.replace(/^www\./i, "");

  if (kind === "instagram") {
    s = s.replace(/^instagram\.com\//i, "").replace(/^@/, "");
    const first = stripTrailingPath(s).split(/[/?#]/)[0] ?? "";
    return decodeURIComponent(first);
  }

  if (kind === "facebook") {
    s = s.replace(/^facebook\.com\//i, "").replace(/^fb\.com\//i, "");
    const parts = stripTrailingPath(s).split(/[/?#]/).filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? s);
  }

  if (kind === "linkedin") {
    const m = s.match(/linkedin\.com\/(?:in|company)\/([^/?#]+)/i);
    if (m) return decodeURIComponent(m[1]);
    return stripTrailingPath(s.replace(/^@/, ""));
  }

  return stripTrailingPath(s.replace(/^@/, ""));
}

/** Tıklanabilir tam URL gösterimi (handle boşsa null). */
export function socialHref(handle: string, kind: SocialKind): string | null {
  const h = handle.trim().replace(/^@/, "");
  if (!h) return null;
  if (/^https?:\/\//i.test(h)) return h;
  if (kind === "instagram") return `https://instagram.com/${encodeURIComponent(h)}`;
  if (kind === "facebook") return `https://facebook.com/${encodeURIComponent(h)}`;
  return `https://linkedin.com/in/${encodeURIComponent(h)}`;
}
