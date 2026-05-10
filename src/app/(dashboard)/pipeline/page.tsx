"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { subscribeGorusmeler } from "@/lib/gorusmeler";
import { useAuth } from "@/components/auth/auth-provider";
import type { Gorusme, MilestoneTipi } from "@/lib/types";
import {
  KURUM_DURUMLARI,
  KURUM_TIPLERI,
  MILESTONE_TIPLERI,
} from "@/lib/constants";
import {
  allMilestonesCompleted,
  formatEtiketlerPreview,
  getAnaKisiAd,
  getKurumDisplayName,
  getPipelineColumnTip,
  getResolvedKurumDurumu,
  isPipelineCardPristine,
} from "@/lib/kurum-helpers";
import { HelpPopover } from "@/components/ui/help-popover";

const FILTER_ALL = "__all__";
const CARD_CAP = 5;

export default function PipelinePage() {
  const { user } = useAuth();
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipFilter, setTipFilter] = useState(FILTER_ALL);
  const [durumFilter, setDurumFilter] = useState(FILTER_ALL);
  const [etiketFilter, setEtiketFilter] = useState(FILTER_ALL);
  const [expandedCols, setExpandedCols] = useState<
    Partial<Record<MilestoneTipi, boolean>>
  >({});

  useEffect(() => {
    if (!user) return;
    const u = subscribeGorusmeler((data) => {
      setGorusmeler(data);
      setLoading(false);
    });
    return () => u();
  }, [user]);

  const etiketOptions = useMemo(() => {
    const s = new Set<string>();
    for (const g of gorusmeler) {
      g.etiketler?.forEach((t) => {
        const x = t.trim();
        if (x) s.add(x);
      });
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "tr"));
  }, [gorusmeler]);

  const filtered = useMemo(() => {
    return gorusmeler.filter((g) => {
      if (tipFilter !== FILTER_ALL && g.kurumTipi !== tipFilter) return false;
      if (
        durumFilter !== FILTER_ALL &&
        getResolvedKurumDurumu(g) !== durumFilter
      )
        return false;
      if (etiketFilter !== FILTER_ALL) {
        const tags = (g.etiketler || []).map((x) => x.trim());
        if (!tags.includes(etiketFilter)) return false;
      }
      return true;
    });
  }, [gorusmeler, tipFilter, durumFilter, etiketFilter]);

  const columns = useMemo(() => {
    const buckets: Record<MilestoneTipi, Gorusme[]> =
      {} as Record<MilestoneTipi, Gorusme[]>;
    for (const m of MILESTONE_TIPLERI) {
      buckets[m.tip] = [];
    }

    const sortByUpdated = (a: Gorusme, b: Gorusme) =>
      b.updatedAt.toMillis() - a.updatedAt.toMillis();

    for (const g of filtered) {
      const col = getPipelineColumnTip(g.milestones);
      buckets[col].push(g);
    }

    for (const m of MILESTONE_TIPLERI) {
      buckets[m.tip].sort(sortByUpdated);
    }

    return buckets;
  }, [filtered]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Pipeline</h1>
          <p className="text-muted-foreground">
            Kurumlar, tamamlanan en ileri adım sütununda listelenir. Detay için
            karta tıklayın.
          </p>
        </div>
        <HelpPopover
          items={[
            "'Yeni' adaylar ilk sütunda soluk kart olarak görünür.",
            "Tüm adımlar bitmiş kurumlar son sütunda yeşil çerçeveli karttır.",
            "Sütun filtresleri uygulanır; taşıma/drag‑drop yoktur.",
          ]}
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <FilterSelect label="Kurum tipi" value={tipFilter} onChange={setTipFilter}>
          <SelectItem value={FILTER_ALL}>Tümü</SelectItem>
          {KURUM_TIPLERI.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Kurum durumu"
          value={durumFilter}
          onChange={setDurumFilter}
        >
          <SelectItem value={FILTER_ALL}>Tümü</SelectItem>
          {KURUM_DURUMLARI.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Etiket"
          value={etiketFilter}
          onChange={setEtiketFilter}
          className="min-w-[10rem]"
        >
          <SelectItem value={FILTER_ALL}>Tümü</SelectItem>
          {etiketOptions.map((e) => (
            <SelectItem key={e} value={e}>
              {e}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Filtreye uygun kurum yok veya henüz kayıt eklenmemiş.
          </CardContent>
        </Card>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="inline-flex gap-4 pb-4 align-top whitespace-nowrap md:flex md:flex-wrap md:whitespace-normal">
            {MILESTONE_TIPLERI.map((def) => {
              const items = columns[def.tip] ?? [];
              const henuzBaslamamisSayisi =
                def.tip === "ilk_iletisim"
                  ? items.filter((g) =>
                      isPipelineCardPristine(g.milestones)
                    ).length
                  : 0;
              return (
                <div
                  key={def.tip}
                  id={`pipeline-col-${def.tip}`}
                  className="w-[min(20rem,calc(100vw-3rem))] shrink-0 align-top whitespace-normal md:w-72 lg:w-64 xl:w-[17rem]"
                >
                  <div className="mb-2 rounded-lg border bg-card px-3 py-2 shadow-xs">
                    <div className="text-sm font-semibold leading-snug">
                      {def.label}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      Bekleyen: {items.length} kurum
                    </div>
                    {def.tip === "ilk_iletisim" && henuzBaslamamisSayisi > 0 ? (
                      <div className="text-[11px] text-muted-foreground">
                        Henüz milestone işaretlenmemiş:{" "}
                        <span className="font-medium text-foreground/80">
                          {henuzBaslamamisSayisi}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex max-h-[min(75vh,40rem)] flex-col gap-2 overflow-y-auto pr-1">
                    <ColumnCards
                      items={items}
                      columnTip={def.tip}
                      expanded={expandedCols[def.tip] ?? false}
                      onExpand={() =>
                        setExpandedCols((p) => ({
                          ...p,
                          [def.tip]: !(p[def.tip] ?? false),
                        }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
  className = "min-w-[9rem]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-background">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function ColumnCards({
  items,
  columnTip,
  expanded,
  onExpand,
}: {
  items: Gorusme[];
  columnTip: MilestoneTipi;
  expanded: boolean;
  onExpand: () => void;
}) {
  const cap = CARD_CAP;
  const shown = expanded ? items : items.slice(0, cap);
  const rest = Math.max(0, items.length - cap);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-xs text-muted-foreground">
        Boş sütun
      </div>
    );
  }

  return (
    <>
      {shown.map((g) => (
        <PipelineKart key={g.id} gorusme={g} columnTip={columnTip} />
      ))}
      {!expanded && rest > 0 ? (
        <button
          type="button"
          className="w-full rounded-md border bg-muted/30 py-2 text-center text-xs font-medium text-primary hover:bg-muted"
          onClick={onExpand}
        >
          +{rest} tane daha
        </button>
      ) : null}
      {expanded && items.length > cap ? (
        <button
          type="button"
          className="w-full py-1 text-center text-xs font-medium text-muted-foreground underline"
          onClick={onExpand}
        >
          Daha az göster
        </button>
      ) : null}
    </>
  );
}

function PipelineKart({
  gorusme,
  columnTip,
}: {
  gorusme: Gorusme;
  columnTip: MilestoneTipi;
}) {
  const ad = getKurumDisplayName(gorusme);
  const pristine = isPipelineCardPristine(gorusme.milestones);
  const fullPipeline = allMilestonesCompleted(gorusme.milestones);
  const ilkIletisimSutunu = columnTip === "ilk_iletisim";

  const muted = ilkIletisimSutunu && pristine;
  const tamamlanmisPipelineHighlight =
    columnTip === "aktif_kullanim" && fullPipeline;

  const { shown, rest } = formatEtiketlerPreview(gorusme.etiketler, 2);

  const updatedHuman = formatDistanceToNow(gorusme.updatedAt.toDate(), {
    locale: tr,
    addSuffix: true,
  });
  const updatedShort = format(gorusme.updatedAt.toDate(), "d.MM.yyyy", {
    locale: tr,
  });

  return (
    <Link href={`/kurumlar/${gorusme.id}`} className="block shrink-0">
      <Card
        className={
          muted
            ? "border-muted-foreground/20 bg-muted/40 opacity-80 transition hover:opacity-100"
            : tamamlanmisPipelineHighlight
              ? "border-2 border-emerald-500/80 shadow-sm transition hover:border-emerald-600"
              : "transition hover:border-primary/40"
        }
      >
        <CardContent className="space-y-2 p-3 text-xs">
          <div className="font-bold leading-snug">{ad}</div>
          <div className="text-muted-foreground">
            {gorusme.sehir?.trim() || "—"}
          </div>
          <div>Ana kişi: {getAnaKisiAd(gorusme)}</div>
          <div>
            Tahmini değer:{" "}
            {gorusme.tahminiDeger != null
              ? `${gorusme.tahminiDeger.toLocaleString("tr-TR")} ₺`
              : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Güncellenme: {updatedShort}{" "}
            <span className="italic">({updatedHuman})</span>
          </div>
          {shown.length ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {shown.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
              {rest > 0 ? (
                <span className="text-[10px] text-muted-foreground">
                  +{rest}
                </span>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
