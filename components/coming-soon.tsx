import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageHeader } from "@/components/page-header";
import { HammerIcon } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader>
        <span className="min-w-0 truncate font-heading text-sm font-medium">{title}</span>
      </PageHeader>
      <div className="flex flex-1 items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HammerIcon />
            </EmptyMedia>
            <EmptyTitle>Coming soon</EmptyTitle>
            <EmptyDescription>
              {title} is not built yet. This screen will show real data once it ships.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </>
  );
}
