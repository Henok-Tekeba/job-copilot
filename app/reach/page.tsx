import { PageHeader } from "@/components/page-header";
import { ReachView } from "@/components/reach/reach-view";

export default function ReachPage() {
  return (
    <>
      <PageHeader>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Reach
        </h1>
      </PageHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Which employers hire internationally, and how reach breaks down across
          the snapshot.
        </p>
        <ReachView />
      </div>
    </>
  );
}
