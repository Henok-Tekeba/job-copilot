import { DigestView } from "@/components/digest/digest-view";
import { PageHeader } from "@/components/page-header";

export default function DigestPage() {
  return (
    <>
      <PageHeader>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Digest
        </h1>
      </PageHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          A preview of the weekly digest: what is new and what is closing soon,
          scored against your profile.
        </p>
        <DigestView />
      </div>
    </>
  );
}
