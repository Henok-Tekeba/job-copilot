import { PageHeader } from "@/components/page-header";

export default function AboutPage() {
  return (
    <>
      <PageHeader>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          About
        </h1>
      </PageHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="font-display text-3xl font-semibold leading-snug tracking-tight">
          Why this exists
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The global remote job market states &ldquo;Africa not eligible&rdquo; in a
          structured field that candidates never see, and almost never lists
          Africa at all. No tool computes what it would take to change that
          answer. This one does.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For every posting it reads two things: will this employer take an
          international applicant, and would you pass the screen — or what are
          you missing before you apply. Every verdict carries the field it came
          from, so it can be inspected and argued with.
        </p>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Built by</span>
          <p className="text-sm">
            Henok Tekeba — Addis Ababa, Ethiopia.
          </p>
          <p className="text-xs text-muted-foreground">
            3rd-year computer science student. Building this because the default
            answer to &ldquo;can I apply?&rdquo; was &ldquo;no&rdquo;, and nobody
            would say why.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Contact</span>
          <a
            href="mailto:tekebahenok6@gmail.com"
            className="text-sm hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            tekebahenok6@gmail.com
          </a>
        </div>
      </div>
    </>
  );
}
