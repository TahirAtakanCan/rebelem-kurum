"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeText } from "@/lib/search";

interface Props {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  /** Listede yoksa serbest metin kabul et (ilçe vb.) */
  allowCustom?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_SHOWN = 80;

export function StringCombobox({
  id,
  label,
  value,
  onChange,
  options,
  allowCustom = false,
  placeholder = "Yaz veya seç",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const nq = normalizeText(q);
    if (!nq) return options.slice(0, MAX_SHOWN);
    return options
      .filter((o) => normalizeText(o).includes(nq))
      .slice(0, MAX_SHOWN);
  }, [options, q]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setQ(value);
        }}
      >
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            className="flex-1"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={disabled}
              aria-label="Listeyi aç"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0" align="start">
          <div className="border-b p-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrele..."
              className="h-9"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-sm text-muted-foreground">
                {allowCustom ? "Listede yok; alana yazabilirsin." : "Sonuç yok"}
              </li>
            ) : (
              filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      opt === value && "bg-muted"
                    )}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("h-4 w-4 shrink-0", opt === value ? "opacity-100" : "opacity-0")}
                    />
                    {opt}
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
