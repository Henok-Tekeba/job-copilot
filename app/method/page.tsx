import { PageHeader } from "@/components/page-header";

export default function MethodPage() {
  return (
    <>
      <PageHeader>
        <h1 className="font-heading text-base font-semibold tracking-tight sm:text-xl">
          Method
        </h1>
      </PageHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="font-heading text-2xl font-semibold leading-snug tracking-tight">
          How a verdict is reached
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every posting is read for two structured signals: the region field the
          feed publishes (when it does) and the posting body. The region field
          wins; the body is the fallback and the evidence.
        </p>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Verdicts</span>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <span className="text-emerald-400">Open to you</span> — worldwide
              remote, or Africa explicitly listed.
            </li>
            <li>
              <span className="text-sky-400">Needs relocation</span> — on-site or
              hybrid abroad, sponsorship not ruled out.
            </li>
            <li>
              <span className="text-amber-400">Conflicting signals</span> — the
              feed and the body disagree.
            </li>
            <li>
              <span className="text-red-400">Region locked</span> — remote but
              tied to another country, or sponsorship refused.
            </li>
            <li>
              <span className="text-amber-400">Reach unclear</span> — no usable
              signal either way.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Evidence
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Each verdict names the field it came from
            (candidate_required_location, location, …) and the value read. If a
            location is unstated, it is shown as &ldquo;not stated&rdquo; rather
            than guessed. Sponsorship is only claimed when the posting says so.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Fit and priority
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Skills are matched against stated requirements when the posting has
            them, against all detected skills otherwise. Priority folds in
            seniority and eligibility, so a role you can never take cannot
            outrank one you can.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Deadlines
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A date is only treated as a deadline when it sits beside an explicit
            deadline label. &ldquo;Founded in 2015&rdquo; is never mistaken for a
            cutoff.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Arguing with a verdict
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If a verdict looks wrong, the evidence panel shows exactly which
            field produced it. Open an issue or email the address on the About
            page with the posting and the field; the engine is updated from
            those.
          </p>
        </div>
      </div>
    </>
  );
}
