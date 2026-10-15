import { updateApplicationStatus } from "@/lib/store";
import { statusSchema } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const statusResult = statusSchema.safeParse(body.status);
  if (!statusResult.success || !body.id) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updated = await updateApplicationStatus(body.id, statusResult.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}