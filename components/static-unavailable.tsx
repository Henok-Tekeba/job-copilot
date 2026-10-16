import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { PageHeader } from "@/components/page-header";

export function StaticUnavailable({ title }: { title: string }) {
  return (
    <>
      <PageHeader>
        <span className="min-w-0 truncate font-heading text-sm font-medium">{title}</span>
      </PageHeader>
      <div className="flex flex-1 items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Available on localhost only</EmptyTitle>
            <EmptyDescription>
              {title} needs the local server and its data files. Run
              npm run dev to use it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </>
  );
}
