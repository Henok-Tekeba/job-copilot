import type { Metadata } from "next";
import { LegalPage, P, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookies — Shortlist",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies">
      <Section heading="Shortlist sets no cookies">
        <P>
          Shortlist does not set tracking, advertising, or session cookies. There
          are no accounts to log into, so there are no authentication cookies
          either.
        </P>
      </Section>

      <Section heading="What we use instead: localStorage">
        <P>
          Your board state — saved internships, applied and dismissed marks,
          posting notes, and any skills you enter for fit scoring — is stored in
          your browser&rsquo;s localStorage. This is not a cookie: it is never
          sent to our servers, is not shared across sites, and is visible only to
          Shortlist on this device. Clearing site data in your browser removes
          it.
        </P>
      </Section>

      <Section heading="Analytics, if enabled">
        <P>
          Where analytics are enabled, Shortlist uses Plausible, which is
          cookieless: it counts aggregate visits without setting cookies and
          without identifying individual visitors.
        </P>
      </Section>

      <Section heading="Third-party pages">
        <P>
          When you click through to an employer&rsquo;s application page, that
          site may set its own cookies under its own policy. Shortlist has no
          control over those.
        </P>
      </Section>
    </LegalPage>
  );
}
