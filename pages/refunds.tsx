import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import { CONTACT_EMAIL } from "../lib/site";

export default function Refunds() {
  return (
    <>
      <Seo
        title="Redock 14-day money-back guarantee"
        description="Redock Pro purchases include a clear 14-day money-back guarantee. Learn how to request a full refund."
      />
      <div className="min-h-screen">
        <Navbar />
        <main className="px-6 pb-24 pt-32">
          <article className="mx-auto max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] signal">Purchase policy</p>
            <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.6rem)] font-semibold tracking-[-0.035em] ink text-balance">
              14-day money-back guarantee
            </h1>
            <p className="mt-6 text-lg leading-relaxed ink-2">
              If Redock Pro is not right for you, ask for a refund within 14 calendar days of purchase and we will refund the full purchase price to the original payment method.
            </p>

            <div className="mt-10 space-y-9">
              <section>
                <h2 className="text-xl font-semibold ink">How to request it</h2>
                <p className="mt-3 leading-relaxed ink-2">
                  Email <a className="signal hover:underline" href={`mailto:${CONTACT_EMAIL}?subject=Redock%20refund%20request`}>{CONTACT_EMAIL}</a> from the address used at checkout. Include “Redock refund” in the subject so we can find the purchase quickly.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold ink">What happens next</h2>
                <p className="mt-3 leading-relaxed ink-2">
                  We will confirm the refund by email. Your Pro licence is deactivated when the payment is refunded; Redock returns to its free feature set and keeps your local settings and saved data. Your bank controls how long the credit takes to appear.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold ink">Try before buying</h2>
                <p className="mt-3 leading-relaxed ink-2">
                  Every Pro feature also has a 14-day in-app trial with no card and no account required. The trial does not reduce the separate 14-day refund window after purchase.
                </p>
              </section>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}
