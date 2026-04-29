"use client";

import { useMemo } from "react";
import { MAZDA_MODEL_OPTIONS, getTrimsForMazdaModel } from "@/lib/mazda-models";

export type VehicleRow = { key: string; modelId: string; trimId: string };

const selectClass =
  "w-full appearance-none rounded-lg border border-zinc-200 bg-white bg-[length:1rem_1rem] bg-[right_0.65rem_center] bg-no-repeat px-3 py-2 pr-10 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

const chevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23737373' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
};

export function VehicleRowsFields({
  rows,
  onChange,
  heading = "Vehicles",
  footerHint = "Choose a Mazda model and trim for each vehicle you want pricing or availability on.",
}: {
  rows: VehicleRow[];
  onChange: (next: VehicleRow[]) => void;
  /** Overrides the left heading next to “Add vehicle”. */
  heading?: string;
  /** Hint shown below the rows. */
  footerHint?: string;
}) {
  function updateRow(
    key: string,
    patch: Partial<Pick<VehicleRow, "modelId" | "trimId">>
  ) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    onChange([
      ...rows,
      { key: crypto.randomUUID(), modelId: "", trimId: "" },
    ]);
  }

  function removeRow(key: string) {
    if (rows.length <= 1) return;
    onChange(rows.filter((r) => r.key !== key));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {heading} <span className="text-red-600 dark:text-red-400">*</span>
        </span>
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
        >
          Add vehicle
        </button>
      </div>

      {rows.map((row, idx) => (
        <div
          key={row.key}
          className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Vehicle {idx + 1}
            </span>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            ) : null}
          </div>

          <VehicleRowSelectors row={row} onPatch={(patch) => updateRow(row.key, patch)} />
        </div>
      ))}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{footerHint}</p>
    </div>
  );
}

function VehicleRowSelectors({
  row,
  onPatch,
}: {
  row: VehicleRow;
  onPatch: (patch: Partial<Pick<VehicleRow, "modelId" | "trimId">>) => void;
}) {
  const trimOptions = useMemo(
    () => (row.modelId ? getTrimsForMazdaModel(row.modelId) : []),
    [row.modelId]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mazda model
        </label>
        <select
          value={row.modelId}
          onChange={(e) => {
            const modelId = e.target.value;
            onPatch({ modelId, trimId: "" });
          }}
          className={selectClass}
          style={chevronStyle}
        >
          <option value="">Select a model...</option>
          {MAZDA_MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Trim
        </label>
        <select
          value={row.trimId}
          onChange={(e) => onPatch({ trimId: e.target.value })}
          className={selectClass}
          style={chevronStyle}
          disabled={!row.modelId}
        >
          <option value="">
            {row.modelId ? "Select a trim..." : "Select a model first..."}
          </option>
          {trimOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
