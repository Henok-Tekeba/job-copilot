import type { Metadata } from "next";
import { LegalPage, P, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Shortlist",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section heading="The short version">
        <P>
          Shortlist has no accounts and no sign-up. We do not run a user
          database, we do not ask for your name, and there is nothing on our
          servers that identifies you. Almost everything you do on Shortlist
          stays inside your own browser.
        </P>
      </Section>

      <Section heading="What we store on your device">
        <P>
          The board saves your choices locally in your browser using
          localStorage: internships you save, ones you mark applied or dismiss,
          notes you write on a posting, and any skills you enter for fit
          scoring. This never leaves your device — clearing your browser data
          erases it permanently. We cannot recover it and cannot see it.
        </P>
      </Section>

      <Section heading="What our servers see">
        <P>
          When you load a page, standard request logs (your IP address, browser
          type, and the page requested) may be processed for security and
      reliability. These logs are not used to profile you and are kept for a
      short retention window.
        </P>
      </Section>

      <Section heading="Analytics">
        <P>
          If analytics are enabled, Shortlist uses Plausible — a cookieless,
          privacy-first analytics service that measures aggregate traffic
          without cookies and without collecting personal data or cross-site
          identifiers.
        </P>
      </Section>

      <Section heading="Third parties">
        <P>
          Internship postings on the board come from third-party applicant
          tracking systems (Greenhouse, Lever, Ashby, Workday, Simplify and
          others). When you click through to apply, you leave Shortlist and
          that company&rsquo;s own privacy policy applies — we have no access to
          what you submit there. Company logos and marks belong to their
          respective owners.
        </P>
      </Section>

      <Section heading="Contact">
        <P>
          Questions about this policy: tekebahenok6@gmail.com
        </P>
      </Section>
    </LegalPage>
  );
}
