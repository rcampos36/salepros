import { NextResponse } from "next/server";
import { appendProspect, listProspects } from "@/lib/prospects-store";
import { validateProspectSubmission } from "@/lib/prospect-validation";

export async function GET() {
  try {
    const prospects = await listProspects();
    return NextResponse.json({ prospects });
  } catch {
    return NextResponse.json(
      { error: "Could not load contacts." },
      { status: 500 }
    );
  }
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function POST(request: Request) {
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

  const validated = validateProspectSubmission(o);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: validated.status }
    );
  }

  const initialInquiryNote = trimOrNull(o.notes);
  if (initialInquiryNote && initialInquiryNote.length > 500) {
    return NextResponse.json(
      { error: "Notes are too long (max 500 characters)." },
      { status: 400 }
    );
  }

  try {
    const { value } = validated;
    const record = await appendProspect({
      fullName: value.fullName,
      phone: value.phone,
      vehicles: value.vehicles,
      notes: null,
      initialInquiryNote,
    });
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save. Try again." },
      { status: 500 }
    );
  }
}
