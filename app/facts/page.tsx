import { StaticUnavailable } from "@/components/static-unavailable";

export default async function FactsPage() {
  if (process.env.NEXT_PUBLIC_STATIC === "1") {
    return <StaticUnavailable title="Facts" />;
  }

  const { FactsServerPage } = await import("./server-page");
  return <FactsServerPage />;
}
