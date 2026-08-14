import Head from "next/head";
import Link from "next/link";
import Footer from "./Footer";
import Navbar from "./Navbar";
import PurchaseTrustLine from "./PurchaseTrustLine";
import Seo from "./Seo";
import { SITE_URL } from "../lib/site";

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface GuideTable {
  columns: string[];
  rows: string[][];
}

export interface GuideLink {
  label: string;
  href: string;
}

interface GuidePageProps {
  kicker: string;
  title: string;
  description: string;
  lede: string;
  path: string;
  sections: GuideSection[];
  table?: GuideTable;
  sources?: GuideLink[];
  related?: GuideLink[];
}

export default function GuidePage({
  kicker,
  title,
  description,
  lede,
  path,
  sections,
  table,
  sources = [],
  related = [],
}: GuidePageProps) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    dateModified: "2026-08-14",
    mainEntityOfPage: `${SITE_URL}${path}`,
    author: { "@type": "Organization", name: "bhopstudio" },
    publisher: { "@type": "Organization", name: "bhopstudio" },
  };

  return (
    <>
      <Seo title={title} description={description} />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      </Head>
      <div className="min-h-screen">
        <Navbar />
        <main className="px-6 pb-24 pt-28 sm:pt-36">
          <article className="mx-auto max-w-3xl">
            <header className="border-b pb-10" style={{ borderColor: "var(--hairline)" }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] signal">
                {kicker}
              </p>
              <h1 className="mt-4 text-[clamp(2.2rem,6vw,4rem)] font-semibold leading-[1.06] tracking-[-0.035em] ink text-balance">
                {title}
              </h1>
              <p className="mt-6 text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed ink-2 text-pretty">
                {lede}
              </p>
              <p className="mt-5 text-[12px] ink-3">Updated 14 August 2026 · 6 minute read</p>
            </header>

            {table && (
              <div className="mt-10 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--hairline)" }}>
                <table className="w-full min-w-[580px] border-collapse text-left text-[14px]">
                  <thead style={{ background: "var(--surface)" }}>
                    <tr>
                      {table.columns.map((column) => (
                        <th key={column} className="border-b px-4 py-3 font-semibold ink" style={{ borderColor: "var(--hairline)" }}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.join("-")} className="border-b last:border-b-0" style={{ borderColor: "var(--hairline)" }}>
                        {row.map((cell, index) => (
                          <td key={`${cell}-${index}`} className={`px-4 py-3 align-top leading-relaxed ${index === 0 ? "font-medium ink" : "ink-2"}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-12 space-y-12">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-[1.55rem] font-semibold tracking-[-0.025em] ink text-balance">
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-[16px] leading-[1.75] ink-2 text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-[15px] leading-relaxed ink-2">
                          <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--signal)" }} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {sources.length > 0 && (
              <section className="mt-14 border-t pt-8" style={{ borderColor: "var(--hairline)" }}>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] ink-3">Sources checked</h2>
                <ul className="mt-4 space-y-2">
                  {sources.map((source) => (
                    <li key={source.href}>
                      <a className="text-[14px] signal hover:underline" href={source.href} target="_blank" rel="noopener noreferrer">
                        {source.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-14 rounded-xl border p-7 sm:p-9" style={{ borderColor: "var(--signal)", background: "var(--surface)" }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] signal">Redock Pro</p>
              <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.03em] ink">Plug in. Get your desk back.</h2>
              <p className="mt-3 max-w-2xl leading-relaxed ink-2">
                Save complete workspaces, route apps automatically, and restore windows across displays. Try every Pro feature for 14 days without a card.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/download" className="rounded-lg px-5 py-3 text-[15px] font-medium" style={{ background: "var(--signal-fill)", color: "var(--signal-ink)" }}>
                  Download Redock
                </Link>
                <Link href="/pricing" className="rounded-lg border px-5 py-3 text-[15px] font-medium ink" style={{ borderColor: "var(--edge)" }}>
                  Buy Redock · £19
                </Link>
              </div>
              <PurchaseTrustLine className="mt-4" />
            </section>

            {related.length > 0 && (
              <nav className="mt-12 border-t pt-8" style={{ borderColor: "var(--hairline)" }} aria-label="Related guides">
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] ink-3">Keep reading</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-lg border p-4 text-[14px] font-medium ink transition-colors hover:signal" style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}>
                      {item.label} →
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}
