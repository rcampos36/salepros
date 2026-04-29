"use client";

import { useState } from "react";
import {
  VehicleRowsFields,
  type VehicleRow,
} from "@/components/vehicle-rows-fields";

type FieldErrors = Partial<Record<string, string>>;

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

export function ProspectForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleRows, setVehicleRows] = useState<VehicleRow[]>(() => [
    { key: crypto.randomUUID(), modelId: "", trimId: "" },
  ]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "Name is required.";
    if (!phone.trim()) next.phone = "Phone number is required.";
    else if (phone.trim().length < 8) next.phone = "Enter a complete phone number.";
    const incomplete = vehicleRows.some((r) => !r.modelId || !r.trimId);
    if (incomplete) next.vehicles = "Every vehicle needs a model and trim.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          vehicles: vehicleRows.map(({ modelId, trimId }) => ({
            mazdaModelId: modelId,
            mazdaTrimId: trimId,
          })),
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setFullName("");
      setPhone("");
      setVehicleRows([{ key: crypto.randomUUID(), modelId: "", trimId: "" }]);
      setNotes("");
      setFieldErrors({});
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-6 py-8 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-lg font-medium text-emerald-900 dark:text-emerald-100">
          Thanks - we received your info.
        </p>
        <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">
          We&apos;ll reach out using the phone number you provided.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          aria-invalid={!!fieldErrors.fullName}
          aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
        />
        {fieldErrors.fullName ? (
          <p id="fullName-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.fullName}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Phone number <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="(555) 123-4567"
          aria-invalid={!!fieldErrors.phone}
          aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
        />
        {fieldErrors.phone ? (
          <p id="phone-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.phone}
          </p>
        ) : null}
      </div>

      <VehicleRowsFields rows={vehicleRows} onChange={setVehicleRows} />
      {fieldErrors.vehicles ? (
        <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.vehicles}</p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Color, package, budget, or financing questions..."
          className={`${inputClass} resize-y min-h-[80px]`}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {loading ? "Sending..." : "Submit"}
      </button>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        By submitting, you agree to be contacted about vehicles and offers.
      </p>
    </form>
  );
}
