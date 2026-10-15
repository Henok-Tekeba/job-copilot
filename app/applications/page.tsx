import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StaticUnavailable } from "@/components/static-unavailable";

export default async function ApplicationsPage() {
  if (process.env.NEXT_PUBLIC_STATIC === "1") {
    return <StaticUnavailable title="Applications" />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </div>
      }
    >
      <ApplicationsServerPageWrapper />
    </Suspense>
  );
}

async function ApplicationsServerPageWrapper() {
  const { ApplicationsServerPage } = await import("./server-page");
  return <ApplicationsServerPage />;
}
