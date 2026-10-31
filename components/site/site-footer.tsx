import Link from "next/link";

/**
 * The sheet footer: legal links and the one-line promise, sized so it reads as
 * a colophon rather than another section.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-5 text-[11px] text-[#8b8b90] ${className}`}
    >
      <span className="text-[#5f5f65]">
        © {new Date().getFullYear()} Shortlist
      </span>
      <Link href="/privacy" className="transition-colors hover:text-[#0b0b0d]">
        Privacy
      </Link>
      <Link href="/terms" className="transition-colors hover:text-[#0b0b0d]">
        Terms
      </Link>
      <Link href="/cookies" className="transition-colors hover:text-[#0b0b0d]">
        Cookies
      </Link>
      <a
        href="mailto:tekebahenok6@gmail.com"
        className="transition-colors hover:text-[#0b0b0d]"
      >
        Contact
      </a>
      <span className="ml-auto">Internships and contracts, read closely.</span>
    </footer>
  );
}
