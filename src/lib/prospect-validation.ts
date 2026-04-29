import { getMazdaModelById, getMazdaTrimById } from "@/lib/mazda-models";
import {
  type ProspectDealOutcome,
  type ProspectVehicle,
} from "@/lib/prospect-types";

export type ParsedProspectSubmission = {
  fullName: string;
  phone: string;
  vehicles: ProspectVehicle[];
};

const MAX_VEHICLES = 12;

function parseVehicleInput(raw: unknown): ProspectVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const mazdaModelId =
    typeof v.mazdaModelId === "string" ? v.mazdaModelId.trim() : "";
  const mazdaTrimId =
    typeof v.mazdaTrimId === "string" ? v.mazdaTrimId.trim() : "";
  if (!mazdaModelId || !mazdaTrimId) return null;

  const model = getMazdaModelById(mazdaModelId);
  if (!model) return null;

  const trim = getMazdaTrimById(model.id, mazdaTrimId);
  if (!trim) return null;

  return {
    mazdaModelId: model.id,
    mazdaModelLabel: model.label,
    mazdaTrimId: trim.id,
    mazdaTrimLabel: trim.label,
  };
}

/**
 * Validates intake / full contact update: name, phone, and 1–12 catalogue vehicles.
 */
export function validateProspectSubmission(
  o: Record<string, unknown>
):
  | { ok: true; value: ParsedProspectSubmission }
  | { ok: false; error: string; status: number } {
  const fullName =
    typeof o.fullName === "string" ? o.fullName.trim() : "";
  const phone =
    typeof o.phone === "string" ? o.phone.trim() : "";

  if (!fullName || fullName.length > 120) {
    return {
      ok: false,
      error: "Name is required (max 120 characters).",
      status: 400,
    };
  }
  if (!phone || phone.length < 8 || phone.length > 40) {
    return {
      ok: false,
      error: "A valid phone number is required.",
      status: 400,
    };
  }

  const vehiclesRaw = o.vehicles;
  let pairs: unknown[] = [];

  if (Array.isArray(vehiclesRaw) && vehiclesRaw.length > 0) {
    pairs = vehiclesRaw;
  } else {
    const mazdaModelId =
      typeof o.mazdaModelId === "string" ? o.mazdaModelId.trim() : "";
    const mazdaTrimId =
      typeof o.mazdaTrimId === "string" ? o.mazdaTrimId.trim() : "";
    if (mazdaModelId && mazdaTrimId) {
      pairs = [{ mazdaModelId, mazdaTrimId }];
    }
  }

  if (pairs.length === 0) {
    return {
      ok: false,
      error: "Add at least one Mazda model and trim.",
      status: 400,
    };
  }

  if (pairs.length > MAX_VEHICLES) {
    return {
      ok: false,
      error: `You can add up to ${MAX_VEHICLES} vehicles.`,
      status: 400,
    };
  }

  const vehicles: ProspectVehicle[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const parsed = parseVehicleInput(pairs[i]);
    if (!parsed) {
      return {
        ok: false,
        error: `Vehicle ${i + 1}: choose a valid Mazda model and trim.`,
        status: 400,
      };
    }
    vehicles.push(parsed);
  }

  return {
    ok: true,
    value: { fullName, phone, vehicles },
  };
}

export function parseDealOutcomePayload(
  raw: unknown
):
  | { ok: true; value: ProspectDealOutcome }
  | { ok: false; error: string; status: number } {
  if (raw === undefined || raw === null) {
    return {
      ok: false,
      error: "Outcome payload is required when updating disposition.",
      status: 400,
    };
  }
  if (typeof raw !== "object") {
    return { ok: false, error: "Invalid outcome payload.", status: 400 };
  }
  const o = raw as Record<string, unknown>;
  const status = typeof o.status === "string" ? o.status.trim() : "";

  if (status === "active") {
    return { ok: true, value: { status: "active" } };
  }

  if (status === "sold_here") {
    const purchasedAtRaw =
      typeof o.purchasedAt === "string" ? o.purchasedAt.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchasedAtRaw)) {
      return {
        ok: false,
        error: "Sale date is required (YYYY-MM-DD).",
        status: 400,
      };
    }
    const stockRaw =
      typeof o.stockNumber === "string" ? o.stockNumber.trim().slice(0, 60) : "";
    const vehicleParsed = parseVehicleInput(o.vehicle);
    if (!vehicleParsed) {
      return {
        ok: false,
        error: "Choose the Mazda model and trim purchased.",
        status: 400,
      };
    }
    return {
      ok: true,
      value: {
        status: "sold_here",
        purchasedAt: purchasedAtRaw,
        stockNumber: stockRaw.length ? stockRaw : null,
        vehicle: vehicleParsed,
      },
    };
  }

  if (status === "not_shopping") {
    const recordedAtRaw =
      typeof o.recordedAt === "string" ? o.recordedAt.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedAtRaw)) {
      return {
        ok: false,
        error: "Choose when they stopped shopping (YYYY-MM-DD).",
        status: 400,
      };
    }
    return {
      ok: true,
      value: { status: "not_shopping", recordedAt: recordedAtRaw },
    };
  }

  if (status === "bought_elsewhere") {
    const recordedAtRaw =
      typeof o.recordedAt === "string" ? o.recordedAt.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedAtRaw)) {
      return {
        ok: false,
        error: "Choose when they bought elsewhere (YYYY-MM-DD).",
        status: 400,
      };
    }
    const detailRaw =
      typeof o.detail === "string" ? o.detail.trim().slice(0, 500) : "";
    return {
      ok: true,
      value: {
        status: "bought_elsewhere",
        recordedAt: recordedAtRaw,
        detail: detailRaw.length ? detailRaw : null,
      },
    };
  }

  return {
    ok: false,
    error:
      "Unknown outcome — use active, sold_here, not_shopping, or bought_elsewhere.",
    status: 400,
  };
}

export function mergeDealOutcomeFromBody(body: Record<string, unknown>):
  | { kind: "skip" }
  | { kind: "err"; error: string; status: number }
  | { kind: "ok"; value: ProspectDealOutcome } {
  if (!("dealOutcome" in body)) return { kind: "skip" };
  const parsed = parseDealOutcomePayload(body.dealOutcome);
  if (!parsed.ok) {
    return { kind: "err", error: parsed.error, status: parsed.status };
  }
  return { kind: "ok", value: parsed.value };
}

/**
 * @deprecated Use {@link validateProspectSubmission}.
 * Named function export so bundlers consistently expose this symbol.
 */
export function validateNewProspectMainFields(
  o: Record<string, unknown>
):
  | { ok: true; value: ParsedProspectSubmission }
  | { ok: false; error: string; status: number } {
  return validateProspectSubmission(o);
}
