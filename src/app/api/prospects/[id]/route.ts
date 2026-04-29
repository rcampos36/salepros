import { NextResponse } from "next/server";
import type { ProspectRecord } from "@/lib/prospect-types";
import { getProspectById, replaceProspect } from "@/lib/prospects-store";
import { isLegacyProspect } from "@/lib/prospect-utils";
import {
  mergeDealOutcomeFromBody,
  validateProspectSubmission,
} from "@/lib/prospect-validation";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteCtx) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;

  const existing = await getProspectById(id);
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  const vehicleUnchanged = o.vehicleUnchanged === true;

  if (isLegacyProspect(existing) && vehicleUnchanged) {
    const fullName =
      typeof o.fullName === "string" ? o.fullName.trim() : "";
    const phone =
      typeof o.phone === "string" ? o.phone.trim() : "";

    if (!fullName || fullName.length > 120) {
      return NextResponse.json(
        { error: "Name is required (max 120 characters)." },
        { status: 400 }
      );
    }
    if (!phone || phone.length < 8 || phone.length > 40) {
      return NextResponse.json(
        { error: "A valid phone number is required." },
        { status: 400 }
      );
    }

    const dm = mergeDealOutcomeFromBody(o);
    if (dm.kind === "err") {
      return NextResponse.json({ error: dm.error }, { status: dm.status });
    }
    const dealOutcome =
      dm.kind === "ok" ? dm.value : existing.dealOutcome;

    const next: ProspectRecord = {
      ...existing,
      fullName,
      phone,
      dealOutcome,
    };

    try {
      await replaceProspect(next);
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        {
          error:
            e instanceof Error ? e.message : "Could not save.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ prospect: next });
  }

  const validated = validateProspectSubmission(o);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: validated.status }
    );
  }

  const { value } = validated;

  const dm = mergeDealOutcomeFromBody(o);
  if (dm.kind === "err") {
    return NextResponse.json({ error: dm.error }, { status: dm.status });
  }
  const dealOutcome =
    dm.kind === "ok" ? dm.value : existing.dealOutcome;

  const next: ProspectRecord = {
    ...existing,
    fullName: value.fullName,
    phone: value.phone,
    vehicles: value.vehicles,
    dealOutcome,
  };

  try {
    await replaceProspect(next);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Could not save.",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ prospect: next });
}
