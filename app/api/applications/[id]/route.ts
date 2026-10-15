import { deleteApplication } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new NextResponse(null, { status: 204 });
  }
  const ok = deleteApplication(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
