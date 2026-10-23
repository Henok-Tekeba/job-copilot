import type { Metadata } from "next";
import { LegalPage, P, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Shortlist",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <Section heading="Acceptance">
        <P>
          By using Shortlist you agree to these terms. If you do not agree,
          please do not use the site.
        </P>
      </Section>

      <Section heading="What Shortlist is">
        <P>
          Shortlist is a free search and scoring tool for tech internships and
          contracts. It aggregates publicly available internship postings from
          third-party applicant tracking systems, reads the posting text for
          eligibility signals (visa sponsorship, location and region limits),
          and grades the fit between a posting&rsquo;s requirements and the
          skills you provide.
        </P>
      </Section>

      <Section heading="No guarantee of accuracy">
        <P>
          Every verdict, fit score and deadline is generated automatically from
          posting text and public company records. Postings change, fill up, or
          close without notice, and automatic reading can misread. Verdicts are
          signals to help you decide — not promises, not legal advice, and not
          a guarantee that any employer will accept you, sponsor you, or even
          respond. Always confirm details on the employer&rsquo;s own site
          before relying on them.
        </P>
      </Section>

      <Section heading="Third-party postings and applications">
        <P>
          Postings belong to the companies that publish them; Shortlist is not
          affiliated with, endorsed by, or acting as an agent of any employer.
          Applications happen on the third-party careers page you reach from a
          posting, under that company&rsquo;s terms. Shortlist never submits
          anything on your behalf.
        </P>
      </Section>

      <Section heading="Acceptable use">
        <P>
          Do not misuse the service: no attempts to overload, scrape at
          disruptive volume, or republish the board wholesale as your own
          product. Personal notes and skills you enter are yours.
        </P>
      </Section>

      <Section heading="Availability and changes">
        <P>
          Shortlist is provided as-is, with no warranty of availability,
          merchantability, or fitness for a particular purpose. Features may
          change or be discontinued at any time. To the maximum extent
          permitted by law, Shortlist&rsquo;s operators are not liable for any
          loss arising from use of the service, including missed deadlines or
          application outcomes.
        </P>
      </Section>

      <Section heading="Governing law">
        <P>
          These terms are governed by the laws of the Federal Democratic
          Republic of Ethiopia. Questions: tekebahenok6@gmail.com
        </P>
      </Section>
    </LegalPage>
  );
}
