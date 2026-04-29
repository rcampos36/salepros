import "server-only";

import fs from "fs/promises";
import path from "path";
import type {
  ProspectDealOutcome,
  ProspectNote,
  ProspectRecord,
  ProspectVehicle,
} from "@/lib/prospect-types";
import { DEFAULT_DEAL_OUTCOME } from "@/lib/prospect-types";

export type {
  ProspectDealOutcome,
  ProspectNote,
  ProspectRecord,
  ProspectVehicle,
} from "@/lib/prospect-types";

function normalizeDealOutcome(o: Record<string, unknown>): ProspectDealOutcome {
  const raw = o.dealOutcome;
  if (raw && typeof raw === "object") {
    const d = raw as Record<string, unknown>;
    const status = typeof d.status === "string" ? d.status.trim() : "";
    if (status === "active") return { status: "active" };
    if (status === "sold_here") {
      const purchasedAtRaw =
        typeof d.purchasedAt === "string" ? d.purchasedAt.trim() : "";
      const purchasedAt = /^\d{4}-\d{2}-\d{2}$/.test(purchasedAtRaw)
        ? purchasedAtRaw
        : null;
      const stockRaw =
        typeof d.stockNumber === "string" ? d.stockNumber.trim() : "";
      const stockNumber =
        stockRaw.length > 0 ? stockRaw.slice(0, 60) : null;
      const vehicle = normalizeVehicleFromRaw(d.vehicle);
      return {
        status: "sold_here",
        purchasedAt,
        stockNumber,
        vehicle,
      };
    }
    if (status === "not_shopping") {
      const recordedAtRaw =
        typeof d.recordedAt === "string" ? d.recordedAt.trim() : "";
      const recordedAt = /^\d{4}-\d{2}-\d{2}$/.test(recordedAtRaw)
        ? recordedAtRaw
        : null;
      return { status: "not_shopping", recordedAt };
    }
    if (status === "bought_elsewhere") {
      const recordedAtRaw =
        typeof d.recordedAt === "string" ? d.recordedAt.trim() : "";
      const recordedAt = /^\d{4}-\d{2}-\d{2}$/.test(recordedAtRaw)
        ? recordedAtRaw
        : null;
      const detailRaw =
        typeof d.detail === "string" ? d.detail.trim().slice(0, 500) : "";
      return {
        status: "bought_elsewhere",
        recordedAt,
        detail: detailRaw.length ? detailRaw : null,
      };
    }
  }

  if (o.purchase && typeof o.purchase === "object") {
    const pu = o.purchase as Record<string, unknown>;
    if (pu.purchased === true) {
      const purchasedAtRaw =
        typeof pu.purchasedAt === "string" ? pu.purchasedAt.trim() : "";
      const purchasedAt = /^\d{4}-\d{2}-\d{2}$/.test(purchasedAtRaw)
        ? purchasedAtRaw
        : null;
      const stockRaw =
        typeof pu.stockNumber === "string" ? pu.stockNumber.trim() : "";
      const stockNumber =
        stockRaw.length > 0 ? stockRaw.slice(0, 60) : null;
      const vehicle = normalizeVehicleFromRaw(pu.vehicle);
      return {
        status: "sold_here",
        purchasedAt,
        stockNumber,
        vehicle,
      };
    }
  }

  return { ...DEFAULT_DEAL_OUTCOME };
}

const DATA_FILE = path.join(process.cwd(), "data", "prospects.json");

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

function normalizeNoteHistory(raw: unknown): ProspectNote[] {
  if (!Array.isArray(raw)) return [];
  const out: ProspectNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const n = item as Record<string, unknown>;
    const text = typeof n.text === "string" ? n.text.trim() : "";
    if (!text) continue;
    const id =
      typeof n.id === "string" && n.id.trim().length > 0
        ? n.id.trim()
        : crypto.randomUUID();
    const createdAt =
      typeof n.createdAt === "string" && n.createdAt.trim().length > 0
        ? n.createdAt.trim()
        : new Date().toISOString();
    out.push({ id, text: text.slice(0, 4000), createdAt });
  }
  out.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return out;
}

function normalizeVehicleFromRaw(raw: unknown): ProspectVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const mazdaModelId =
    typeof v.mazdaModelId === "string" ? v.mazdaModelId.trim() : "";
  const mazdaModelLabel =
    typeof v.mazdaModelLabel === "string" ? v.mazdaModelLabel.trim() : "";
  const mazdaTrimId =
    typeof v.mazdaTrimId === "string" ? v.mazdaTrimId.trim() : "";
  const mazdaTrimLabel =
    typeof v.mazdaTrimLabel === "string" ? v.mazdaTrimLabel.trim() : "";

  if (
    mazdaModelId &&
    mazdaModelLabel &&
    mazdaTrimId &&
    mazdaTrimLabel
  ) {
    return {
      mazdaModelId,
      mazdaModelLabel,
      mazdaTrimId,
      mazdaTrimLabel,
    };
  }
  return null;
}

function normalizeProspect(raw: unknown): ProspectRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if (typeof o.fullName !== "string" || typeof o.phone !== "string") return null;

  const createdAt =
    typeof o.createdAt === "string" && o.createdAt.trim().length > 0
      ? o.createdAt.trim()
      : new Date(0).toISOString();

  const id =
    typeof o.id === "string" && o.id.trim().length > 0
      ? o.id.trim()
      : `legacy-${createdAt}-${o.fullName.trim()}-${o.phone.trim()}`.replace(
          /[^a-zA-Z0-9_-]+/g,
          "-"
        );

  const mazdaModelId =
    typeof o.mazdaModelId === "string" ? o.mazdaModelId.trim() : "";
  const mazdaModelLabel =
    typeof o.mazdaModelLabel === "string" ? o.mazdaModelLabel.trim() : "";
  const mazdaTrimId =
    typeof o.mazdaTrimId === "string" ? o.mazdaTrimId.trim() : "";
  const mazdaTrimLabel =
    typeof o.mazdaTrimLabel === "string" ? o.mazdaTrimLabel.trim() : "";

  const notes: string | null =
    typeof o.notes === "string" && o.notes.trim().length > 0 ? o.notes.trim() : null;

  let noteHistory = normalizeNoteHistory(o.noteHistory);
  if (noteHistory.length === 0 && notes) {
    noteHistory = [
      {
        id: `migrated-${id.slice(0, 12)}`,
        text: notes,
        createdAt,
      },
    ];
  }

  const legacyInterest =
    typeof o.carInterest === "string" ? o.carInterest.trim() : "";

  let vehicles: ProspectVehicle[] = [];

  if (Array.isArray(o.vehicles) && o.vehicles.length > 0) {
    for (const item of o.vehicles) {
      const nv = normalizeVehicleFromRaw(item);
      if (nv) vehicles.push(nv);
    }
  }

  if (vehicles.length === 0) {
    const hasLegacyFour =
      mazdaModelId &&
      mazdaModelLabel &&
      mazdaTrimId &&
      mazdaTrimLabel;

    if (hasLegacyFour) {
      vehicles = [
        {
          mazdaModelId,
          mazdaModelLabel,
          mazdaTrimId,
          mazdaTrimLabel,
        },
      ];
    } else if (legacyInterest.length > 0) {
      vehicles = [
        {
          mazdaModelId: "legacy",
          mazdaModelLabel: legacyInterest,
          mazdaTrimId: "legacy",
          mazdaTrimLabel: "—",
        },
      ];
    }
  }

  if (vehicles.length === 0) return null;

  const dealOutcome = normalizeDealOutcome(o);

  return {
    id,
    createdAt,
    fullName: o.fullName.trim(),
    phone: o.phone.trim(),
    vehicles,
    dealOutcome,
    notes: noteHistory.length > 0 ? null : notes,
    noteHistory,
  };
}

export async function listProspects(): Promise<ProspectRecord[]> {
  await ensureDataFile();
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const rows: ProspectRecord[] = [];
  for (const item of parsed) {
    const row = normalizeProspect(item);
    if (row) rows.push(row);
  }

  rows.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return rows;
}

export async function getProspectById(id: string): Promise<ProspectRecord | null> {
  const all = await listProspects();
  return all.find((p) => p.id === id) ?? null;
}

export async function replaceProspect(updated: ProspectRecord): Promise<boolean> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }
  const list = Array.isArray(parsed) ? [...parsed] : [];
  const normalized = list
    .map((item) => normalizeProspect(item))
    .filter((r): r is ProspectRecord => r !== null);
  const idx = normalized.findIndex((p) => p.id === updated.id);
  if (idx === -1) return false;
  normalized[idx] = updated;
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), "utf8");
  return true;
}

export async function appendProspect(
  entry: Omit<
    ProspectRecord,
    "id" | "createdAt" | "noteHistory" | "dealOutcome"
  > & {
    initialInquiryNote: string | null;
  }
): Promise<ProspectRecord> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  let list: ProspectRecord[];
  try {
    list = JSON.parse(raw) as ProspectRecord[];
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  const createdAt = new Date().toISOString();
  const noteHistory: ProspectNote[] =
    entry.initialInquiryNote && entry.initialInquiryNote.trim().length > 0
      ? [
          {
            id: crypto.randomUUID(),
            text: entry.initialInquiryNote.trim().slice(0, 4000),
            createdAt,
          },
        ]
      : [];

  const record: ProspectRecord = {
    id: crypto.randomUUID(),
    createdAt,
    fullName: entry.fullName,
    phone: entry.phone,
    vehicles: entry.vehicles,
    dealOutcome: DEFAULT_DEAL_OUTCOME,
    notes: null,
    noteHistory,
  };

  list.push(record);
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
  return record;
}

export async function appendNoteToProspect(
  prospectId: string,
  text: string
): Promise<ProspectRecord | null> {
  const trimmed = text.trim().slice(0, 4000);
  if (!trimmed.length) return null;

  const current = await getProspectById(prospectId);
  if (!current) return null;

  const note: ProspectNote = {
    id: crypto.randomUUID(),
    text: trimmed,
    createdAt: new Date().toISOString(),
  };

  const next: ProspectRecord = {
    ...current,
    noteHistory: [...current.noteHistory, note].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    ),
  };

  const ok = await replaceProspect(next);
  return ok ? next : null;
}

