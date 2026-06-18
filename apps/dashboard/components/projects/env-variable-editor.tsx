"use client";

import { Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { looksLikeEnvPaste, parseEnvPaste } from "@/lib/parse-env-paste";
import type { EnvVariableRow } from "@/lib/types";

interface EnvVariableEditorProps {
  rows: EnvVariableRow[];
  onChange: (rows: EnvVariableRow[]) => void;
  disabled?: boolean;
}

export function EnvVariableEditor({
  rows,
  onChange,
  disabled = false,
}: EnvVariableEditorProps) {
  function addRow() {
    onChange([...rows, { key: "", value: "" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function handleKeyPaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    if (index !== 0) return;
    const text = event.clipboardData.getData("text");
    if (!looksLikeEnvPaste(text)) return;

    event.preventDefault();
    const parsed = parseEnvPaste(text);
    if (parsed.length === 0) return;

    const next = [...rows];
    for (let i = 0; i < parsed.length; i++) {
      const entry = parsed[i];
      if (i < next.length) {
        next[i] = { ...next[i], key: entry.key, value: entry.value, hasExistingValue: false };
      } else {
        next.push({ key: entry.key, value: entry.value });
      }
    }
    onChange(next);
  }

  function updateRow(index: number, field: "key" | "value", value: string) {
    const updated = rows.map((row, i) => {
      if (i !== index) return row;
      // Once the user types a new value, clear the hasExistingValue flag so
      // the API receives the new value and re-encrypts it.
      if (field === "value") {
        return { ...row, value, hasExistingValue: false };
      }
      return { ...row, [field]: value };
    });
    onChange(updated);
  }

  const duplicateKeys = (() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const row of rows) {
      const k = row.key.trim();
      if (k && seen.has(k)) dupes.add(k);
      seen.add(k);
    }
    return dupes;
  })();

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const isDuplicate = Boolean(row.key.trim() && duplicateKeys.has(row.key.trim()));
            // When row has a saved value and the user hasn't typed a new one,
            // show the masked placeholder instead of a blank input.
            const showMasked = Boolean(row.hasExistingValue && row.value === "");
            return (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="KEY"
                  value={row.key}
                  onChange={(e) => updateRow(index, "key", e.target.value)}
                  onPaste={(e) => handleKeyPaste(index, e)}
                  disabled={disabled}
                  aria-invalid={isDuplicate ? true : undefined}
                  className="flex-1 font-mono text-sm"
                />
                <Input
                  placeholder={showMasked ? "••••••••" : "value"}
                  value={row.value}
                  onChange={(e) => updateRow(index, "value", e.target.value)}
                  disabled={disabled}
                  className="flex-1 font-mono text-sm"
                  type="text"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                  aria-label="Remove variable"
                >
                  <X />
                </Button>
              </div>
            );
          })}
          {duplicateKeys.size > 0 && (
            <p className="text-xs text-destructive">
              Duplicate keys are not allowed:{" "}
              {[...duplicateKeys].join(", ")}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Paste multiple <code className="font-mono">KEY=value</code> lines into the first key field to add them all at once.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        className="gap-1.5"
      >
        <Plus />
        Add variable
      </Button>
    </div>
  );
}
