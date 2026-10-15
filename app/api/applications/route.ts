import { createApplication, getApplications } from "@/lib/store";
import { applicationSnapshotSchema } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const apps = await getApplications();
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = applicationSnapshotSchema.safeParse({
    title: body.title,
    company: body.company,
    url: body.url,
    source: "manual",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const app = await createApplication({
    jobId: null,
    snapshot: parsed.data,
    appliedAt: body.appliedAt,
    notes: body.notes ?? "",
  });
  return NextResponse.json(app);
}