import Link from "next/link";
import { SnapMark } from "./Marks";
import { CONTACT_EMAIL } from "../lib/site";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Guides", href: "/#guides" },
  { label: "Pricing", href: "/pricing" },
  { label: "Download", href: "/download" },
  { label: "Changelog", href: "/changelog" },
  { label: "Manage licence", href: "/manage-license" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t px-6 py-12" style={{ borderColor: "var(--hairline)" }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <SnapMark className="h-[20px] w-[22px] signal" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] ink">Redock</span>
          </div>
          <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed ink-3">
            Plug in your display. Your workspace puts itself back.
          </p>

          {/*
            Featured on VibeCodingList. Deliberately a plain <a><img> rather
            than next/link and next/image: the markup has to survive into the
            static HTML so the link is crawlable and VCL can verify it with
            curl. The badge is an opaque lockup with its own background, so it
            reads correctly against both the light and dark palettes without a
            wrapper. Followed link, no nofollow.
          */}
          <a
            href="https://vibecodinglist.com/projects/redock?utm_source=vcl_badge&utm_medium=builder_site&utm_campaign=listed_badge&utm_content=redock"
            target="_blank"
            rel="noopener"
            className="mt-6 inline-block"
          >
            <img
              src="https://vibecodinglist.com/assets/embed-widget/featured-on-badge-dark.png"
              alt="Featured on VibeCodingList"
              width="200"
              height="51"
            />
          </a>

          <p className="mt-6 text-[13px] ink-3">
            &copy; {year} bhopstudio
          </p>
        </div>

        {/*
          On a phone this grid is two columns of 14px text, which gave each
          link a ~20px tall target. min-h-[44px] with the label centred fixes
          that without changing how the column reads. Released from sm up,
          where the pointer is precise and the extra height would only stretch
          the footer.
        */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 sm:gap-y-2.5 sm:flex sm:flex-col sm:items-end">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex min-h-[44px] items-center text-[14px] ink-2 transition-colors duration-150 hover:ink sm:min-h-0"
            >
              {link.label}
            </Link>
          ))}
          {/*
            A plain mailto rather than a contact form. Someone deciding whether
            to trust an unsigned download wants to see a real address, and one
            they can reach without filling anything in.
          */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex min-h-[44px] items-center text-[14px] ink-2 transition-colors duration-150 hover:ink sm:min-h-0"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
