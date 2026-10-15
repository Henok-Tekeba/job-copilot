import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export function StaticUnavailable({ title }: { title: string }) {
  return (
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
  );
}
