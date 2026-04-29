import type { Metadata } from "next";
import Link from "next/link";
import { ContactManage } from "@/components/contact-manage";
import type { ProspectRecord } from "@/lib/prospect-types";
import { listProspects } from "@/lib/prospects-store";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Saved contacts — Sales Pros",
  description: "Review saved Mazda vehicle inquiries.",
};

export const dynamic = "force-dynamic";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function contactManageRevision(p: ProspectRecord) {
  const nh = p.noteHistory.map((n) => n.id).join(",");
  const vs = p.vehicles.map((v) => `${v.mazdaModelId}:${v.mazdaTrimId}`).join("|");
  return `${p.fullName}|${p.phone}|${vs}|${JSON.stringify(p.dealOutcome)}|${nh}`;
}

function formatSaleDay(ymd: string) {
  const parts = ymd.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const day = parts[2];
  if (
    y === undefined ||
    m === undefined ||
    day === undefined ||
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(day)
  ) {
    return ymd;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(y, m - 1, day)
  );
}

function renderDisposition(p: ProspectRecord) {
  if (p.dealOutcome.status === "active") {
    return <span className="text-zinc-400">-</span>;
  }
  if (p.dealOutcome.status === "sold_here") {
    return (
      <div className="space-y-1">
        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-200">
          Sold here
        </span>
        {p.dealOutcome.vehicle ? (
          <p className="text-xs leading-snug">
            <span className="font-medium">{p.dealOutcome.vehicle.mazdaModelLabel}</span>
            {" - "}
            {p.dealOutcome.vehicle.mazdaTrimLabel}
          </p>
        ) : null}
        {p.dealOutcome.purchasedAt ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatSaleDay(p.dealOutcome.purchasedAt)}
          </p>
        ) : null}
        {p.dealOutcome.stockNumber ? (
          <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
            Stock #{p.dealOutcome.stockNumber}
          </p>
        ) : null}
      </div>
    );
  }
  if (p.dealOutcome.status === "not_shopping") {
    return (
      <div className="space-y-1">
        <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
          Not shopping
        </span>
        {p.dealOutcome.recordedAt ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatSaleDay(p.dealOutcome.recordedAt)}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-950 dark:bg-amber-950/80 dark:text-amber-100">
        Elsewhere
      </span>
      {p.dealOutcome.recordedAt ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatSaleDay(p.dealOutcome.recordedAt)}
        </p>
      ) : null}
      {p.dealOutcome.detail ? (
        <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-400">
          {p.dealOutcome.detail}
        </p>
      ) : null}
    </div>
  );
}

export default async function ContactsPage() {
  const prospects = await listProspects();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Saved contacts
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Leads are stored in{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              data/prospects.json
            </code>{" "}
            on this machine. You can also open{" "}
            <Link
              href="/api/prospects"
              className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
            >
              /api/prospects
            </Link>{" "}
            for raw JSON.
          </p>
        </div>

        {prospects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No contacts yet.{" "}
              <Link
                href="/"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-50"
              >
                Submit an inquiry
              </Link>{" "}
              to save one here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:hidden">
              {prospects.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {p.fullName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatWhen(p.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{p.phone}</p>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Interested in
                      </p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {p.vehicles.map((v, i) => (
                          <li key={`${v.mazdaModelId}-${v.mazdaTrimId}-${i}`}>
                            <span className="font-medium">{v.mazdaModelLabel}</span>
                            {" - "}
                            {v.mazdaTrimLabel}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Disposition
                      </p>
                      <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {renderDisposition(p)}
                      </div>
                    </div>

                    <div className="pt-1">
                      <ContactManage key={`${p.id}-${contactManageRevision(p)}`} prospect={p} />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Interested in</th>
                    <th className="px-4 py-3">Disposition</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {prospects.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {formatWhen(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {p.fullName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {p.phone}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        <ul className="list-inside list-disc space-y-1">
                          {p.vehicles.map((v, i) => (
                            <li key={`${v.mazdaModelId}-${v.mazdaTrimId}-${i}`}>
                              <span className="font-medium">{v.mazdaModelLabel}</span>
                              {" — "}
                              {v.mazdaTrimLabel}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="max-w-[260px] px-4 py-3 align-top text-zinc-700 dark:text-zinc-300">
                        {renderDisposition(p)}
                      </td>
                      <td className="min-w-[140px] px-4 py-3">
                        <ContactManage
                          key={`${p.id}-${contactManageRevision(p)}`}
                          prospect={p}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        For production, use a hosted database and protect this page with login.
      </footer>
    </div>
  );
}
