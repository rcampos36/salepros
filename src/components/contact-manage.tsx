"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ProspectDealOutcome,
  ProspectRecord,
} from "@/lib/prospect-types";
import { isLegacyProspect } from "@/lib/prospect-utils";
import {
  VehicleRowsFields,
  type VehicleRow,
} from "@/components/vehicle-rows-fields";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function prospectToVehicleRows(prospect: ProspectRecord): VehicleRow[] {
  return prospect.vehicles.map((v) => ({
    key: crypto.randomUUID(),
    modelId: v.mazdaModelId === "legacy" ? "" : v.mazdaModelId,
    trimId: v.mazdaModelId === "legacy" ? "" : v.mazdaTrimId,
  }));
}

function soldVehicleRowsFromDeal(deal: ProspectDealOutcome): VehicleRow[] {
  const v = deal.status === "sold_here" ? deal.vehicle : null;
  if (v && v.mazdaModelId !== "legacy") {
    return [
      {
        key: crypto.randomUUID(),
        modelId: v.mazdaModelId,
        trimId: v.mazdaTrimId,
      },
    ];
  }
  return [{ key: crypto.randomUUID(), modelId: "", trimId: "" }];
}

function closedDateFromDeal(deal: ProspectDealOutcome): string {
  if (deal.status === "not_shopping" || deal.status === "bought_elsewhere") {
    return deal.recordedAt ?? "";
  }
  return "";
}

function elsewhereDetailFromDeal(deal: ProspectDealOutcome): string {
  if (deal.status === "bought_elsewhere") {
    return deal.detail ?? "";
  }
  return "";
}

export function ContactManage({ prospect }: { prospect: ProspectRecord }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"edit" | "notes" | null>(null);

  const legacy = isLegacyProspect(prospect);

  const [editFullName, setEditFullName] = useState(prospect.fullName);
  const [editPhone, setEditPhone] = useState(prospect.phone);
  const [catalogUpgrade, setCatalogUpgrade] = useState(false);
  const [vehicleRows, setVehicleRows] = useState<VehicleRow[]>([]);

  const [outcomeChoice, setOutcomeChoice] = useState<
    ProspectDealOutcome["status"]
  >(() => prospect.dealOutcome.status);

  const [soldDate, setSoldDate] = useState(() =>
    prospect.dealOutcome.status === "sold_here"
      ? prospect.dealOutcome.purchasedAt ?? ""
      : ""
  );
  const [soldStock, setSoldStock] = useState(() =>
    prospect.dealOutcome.status === "sold_here"
      ? prospect.dealOutcome.stockNumber ?? ""
      : ""
  );
  const [soldVehicleRows, setSoldVehicleRows] = useState<VehicleRow[]>(() =>
    soldVehicleRowsFromDeal(prospect.dealOutcome)
  );

  const [closedDate, setClosedDate] = useState(() =>
    closedDateFromDeal(prospect.dealOutcome)
  );
  const [elsewhereDetail, setElsewhereDetail] = useState(() =>
    elsewhereDetailFromDeal(prospect.dealOutcome)
  );

  const [noteText, setNoteText] = useState("");

  const sortedNotes = useMemo(
    () =>
      [...prospect.noteHistory].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      ),
    [prospect.noteHistory]
  );

  function resetEditForm() {
    setEditFullName(prospect.fullName);
    setEditPhone(prospect.phone);
    setCatalogUpgrade(false);
    setVehicleRows(prospectToVehicleRows(prospect));
    setOutcomeChoice(prospect.dealOutcome.status);
    setSoldDate(
      prospect.dealOutcome.status === "sold_here"
        ? prospect.dealOutcome.purchasedAt ?? ""
        : ""
    );
    setSoldStock(
      prospect.dealOutcome.status === "sold_here"
        ? prospect.dealOutcome.stockNumber ?? ""
        : ""
    );
    setSoldVehicleRows(soldVehicleRowsFromDeal(prospect.dealOutcome));
    setClosedDate(closedDateFromDeal(prospect.dealOutcome));
    setElsewhereDetail(elsewhereDetailFromDeal(prospect.dealOutcome));
  }

  function buildDealOutcomePayload(): Record<string, unknown> {
    switch (outcomeChoice) {
      case "active":
        return { status: "active" };
      case "sold_here": {
        const row = soldVehicleRows[0];
        return {
          status: "sold_here",
          purchasedAt: soldDate.trim(),
          stockNumber: soldStock.trim()
            ? soldStock.trim().slice(0, 60)
            : null,
          vehicle: {
            mazdaModelId: row?.modelId ?? "",
            mazdaTrimId: row?.trimId ?? "",
          },
        };
      }
      case "not_shopping":
        return {
          status: "not_shopping",
          recordedAt: closedDate.trim(),
        };
      case "bought_elsewhere":
        return {
          status: "bought_elsewhere",
          recordedAt: closedDate.trim(),
          detail: elsewhereDetail.trim().slice(0, 500) || null,
        };
      default:
        return { status: "active" };
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const legacyPartialSave = legacy && !catalogUpgrade;

    if (!legacyPartialSave) {
      const incomplete = vehicleRows.some((r) => !r.modelId || !r.trimId);
      if (incomplete) {
        setError("Every vehicle needs a Mazda model and trim.");
        return;
      }
    }

    if (outcomeChoice === "sold_here") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(soldDate.trim())) {
        setError("Choose a valid sale date.");
        return;
      }
      const pr = soldVehicleRows[0];
      if (!pr?.modelId || !pr?.trimId) {
        setError("Choose the Mazda model and trim purchased.");
        return;
      }
    }

    if (
      outcomeChoice === "not_shopping" ||
      outcomeChoice === "bought_elsewhere"
    ) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(closedDate.trim())) {
        setError("Choose the date for this outcome.");
        return;
      }
    }

    const dealOutcomePayload = buildDealOutcomePayload();

    setBusy(true);
    try {
      if (legacyPartialSave) {
        const res = await fetch(`/api/prospects/${encodeURIComponent(prospect.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: editFullName.trim(),
            phone: editPhone.trim(),
            vehicleUnchanged: true,
            dealOutcome: dealOutcomePayload,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not save.");
          return;
        }
      } else {
        const res = await fetch(`/api/prospects/${encodeURIComponent(prospect.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: editFullName.trim(),
            phone: editPhone.trim(),
            vehicles: vehicleRows.map(({ modelId, trimId }) => ({
              mazdaModelId: modelId,
              mazdaTrimId: trimId,
            })),
            vehicleUnchanged: false,
            dealOutcome: dealOutcomePayload,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not save.");
          return;
        }
      }

      setDialog(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = noteText.trim();
    if (!text.length) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/prospects/${encodeURIComponent(prospect.id)}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add note.");
        return;
      }
      setNoteText("");
      setDialog(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const notesPreview =
    prospect.noteHistory.length > 0
      ? `${prospect.noteHistory.length} note${prospect.noteHistory.length === 1 ? "" : "s"}`
      : "No notes yet";

  const legacyInterestLabel =
    legacy && prospect.vehicles[0]
      ? prospect.vehicles[0].mazdaModelLabel
      : "";

  const showVehicleEditors = catalogUpgrade || !legacy;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{notesPreview}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            resetEditForm();
            setError(null);
            setDialog("edit");
          }}
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setNoteText("");
            setDialog("notes");
          }}
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Notes
        </button>
      </div>

      {dialog === "edit" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) setDialog(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-contact-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3
              id="edit-contact-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Edit contact
            </h3>

            {legacy ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                Original vehicle interest (legacy):{" "}
                <span className="font-medium">{legacyInterestLabel}</span>. Update name and
                phone here, or use the catalogue below for structured Mazda models.
              </div>
            ) : null}

            <form className="mt-4 space-y-4" onSubmit={submitEdit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Phone
                </label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={inputClass}
                  type="tel"
                  inputMode="tel"
                  required
                />
              </div>

              {legacy ? (
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={catalogUpgrade}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setCatalogUpgrade(on);
                        if (on) {
                          setVehicleRows([
                            {
                              key: crypto.randomUUID(),
                              modelId: "",
                              trimId: "",
                            },
                          ]);
                        } else {
                          setVehicleRows(prospectToVehicleRows(prospect));
                        }
                      }}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    Pick vehicle(s) from Mazda catalogue
                  </label>
                </div>
              ) : null}

              {showVehicleEditors ? (
                <VehicleRowsFields rows={vehicleRows} onChange={setVehicleRows} />
              ) : null}

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Disposition
                </p>
                <div className="mt-3 space-y-1.5">
                  <label
                    htmlFor="lead-outcome"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Lead outcome
                  </label>
                  <select
                    id="lead-outcome"
                    value={outcomeChoice}
                    onChange={(e) =>
                      setOutcomeChoice(
                        e.target.value as ProspectDealOutcome["status"]
                      )
                    }
                    className={inputClass}
                  >
                    <option value="active">Still shopping</option>
                    <option value="sold_here">Purchased here</option>
                    <option value="not_shopping">No longer shopping</option>
                    <option value="bought_elsewhere">Bought elsewhere</option>
                  </select>
                </div>

                {outcomeChoice === "sold_here" ? (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Sale date
                      </label>
                      <input
                        type="date"
                        value={soldDate}
                        onChange={(e) => setSoldDate(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Stock number{" "}
                        <span className="font-normal text-zinc-400">
                          (optional)
                        </span>
                      </label>
                      <input
                        value={soldStock}
                        onChange={(e) =>
                          setSoldStock(e.target.value.slice(0, 60))
                        }
                        placeholder="e.g. dealer stock #"
                        className={inputClass}
                        autoComplete="off"
                      />
                    </div>
                    <VehicleRowsFields
                      heading="Purchased vehicle"
                      footerHint="Select the Mazda model and trim sold (first row if you add more than one)."
                      rows={soldVehicleRows}
                      onChange={setSoldVehicleRows}
                    />
                  </div>
                ) : null}

                {outcomeChoice === "not_shopping" ||
                outcomeChoice === "bought_elsewhere" ? (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {outcomeChoice === "not_shopping"
                          ? "Stopped shopping on"
                          : "Bought elsewhere on"}
                      </label>
                      <input
                        type="date"
                        value={closedDate}
                        onChange={(e) => setClosedDate(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                    {outcomeChoice === "bought_elsewhere" ? (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Details{" "}
                          <span className="font-normal text-zinc-400">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          value={elsewhereDetail}
                          onChange={(e) =>
                            setElsewhereDetail(e.target.value.slice(0, 500))
                          }
                          placeholder="Brand, dealer, or vehicle notes..."
                          rows={2}
                          className={`${inputClass} resize-y`}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {busy ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {dialog === "notes" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) setDialog(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-title"
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <h3
                id="notes-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Notes
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Each note stores the date and time it was added.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {sortedNotes.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No notes yet. Add one below.
                </p>
              ) : (
                <ul className="space-y-4">
                  {sortedNotes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60"
                    >
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {formatStamp(n.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                        {n.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-700"
              onSubmit={submitNote}
            >
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Add a note
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Follow-up, callback outcome, trade-in details..."
                className={`${inputClass} mt-1 resize-y`}
              />
              {error ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={busy || !noteText.trim()}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {busy ? "Adding..." : "Add note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
