import { updateApplicationNotes } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.id || typeof body.notes !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updated = await updateApplicationNotes(body.id, body.notes);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}