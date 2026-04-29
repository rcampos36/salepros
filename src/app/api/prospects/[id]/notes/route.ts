import { NextResponse } from "next/server";
import { appendNoteToProspect } from "@/lib/prospects-store";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteCtx) {
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

  const text =
    typeof (body as { text?: unknown }).text === "string"
      ? (body as { text: string }).text
      : "";

  const trimmed = text.trim();
  if (!trimmed.length) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }
  if (trimmed.length > 4000) {
    return NextResponse.json(
      { error: "Note is too long (max 4000 characters)." },
      { status: 400 }
    );
  }

  try {
    const prospect = await appendNoteToProspect(id, trimmed);
    if (!prospect) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }

    return NextResponse.json({ prospect });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Could not save note.",
      },
      { status: 500 }
    );
  }
}
