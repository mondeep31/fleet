"use client";

import { Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  function updateRow(index: number, field: "key" | "value", value: string) {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row,
    );
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
            const isDuplicate = row.key.trim() && duplicateKeys.has(row.key.trim());
            return (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="KEY"
                  value={row.key}
                  onChange={(e) => updateRow(index, "key", e.target.value)}
                  disabled={disabled}
                  aria-invalid={isDuplicate ? true : undefined}
                  className="flex-1 font-mono text-sm"
                />
                <Input
                  placeholder="value"
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
