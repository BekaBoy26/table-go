"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  /** Ready-made options; selected custom values are shown after them. */
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Single choice: picking one replaces the previous (click again to clear). */
  single?: boolean;
  customPlaceholder: string;
};

const chip = "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors";

/** Clickable chips from a preset list, plus a field to add a value that isn't in it. */
const ChipPicker = ({ options, value, onChange, single, customPlaceholder }: Props) => {
  const [custom, setCustom] = useState("");
  const has = (v: string) => value.some((x) => x.toLowerCase() === v.toLowerCase());

  const toggle = (v: string) => {
    if (has(v)) onChange(value.filter((x) => x.toLowerCase() !== v.toLowerCase()));
    else onChange(single ? [v] : [...value, v]);
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    // reuse the preset's spelling if it's just typed in another case
    const known = options.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v;
    if (!has(known)) onChange(single ? [known] : [...value, known]);
    setCustom("");
  };

  const customSelected = value.filter((v) => !options.some((o) => o.toLowerCase() === v.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={has(o)}
            onClick={() => toggle(o)}
            className={cn(chip, has(o) ? "bg-primary text-white" : "bg-muted hover:bg-border")}
          >
            {o}
          </button>
        ))}
        {customSelected.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggle(v)}
            aria-label={`Remove ${v}`}
            className={cn(chip, "bg-primary text-white")}
          >
            {v} <X size={14} />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the value instead of submitting the whole form
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          maxLength={40}
          placeholder={customPlaceholder}
          className="h-9 max-w-64 rounded-xl"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-40"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
};

export default ChipPicker;
