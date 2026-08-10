import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";
import { CONTACT_EMAIL } from "../lib/site";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{title}</h2>
      <div className="flex flex-col gap-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <>
      <Seo
        title="Redock privacy policy"
        description="Privacy Policy for Redock. Learn what data we collect and how we use it."
      />
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
                Legal
              </p>
              <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-neutral-900 dark:text-white leading-tight mb-4">
                Privacy Policy
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                Last updated: 30 March 2026
              </p>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">

              <Section title="Overview">
                <p>
                  Redock (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy.
                  This policy explains what information we collect, why we collect it, and how we use it when you use our macOS application and website.
                </p>
                <p>
                  We collect the minimum data necessary to operate the service. We do not sell your personal data to third parties.
                </p>
              </Section>

              <Section title="Information We Collect">
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Account information.</strong>{" "}
                  When you create an account, we collect your email address and a hashed password. This is stored securely via Supabase.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Purchase information.</strong>{" "}
                  When you subscribe to Redock, payment is processed by Stripe. We receive a confirmation of payment and a customer identifier, but we never store your card details.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">License key.</strong>{" "}
                  We generate a unique license key associated with your account. This is stored in our database and used solely to verify your Pro subscription in the macOS app.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Device identifier.</strong>{" "}
                  The macOS app generates a random UUID the first time it activates a license. This is used only to track activation count (max 3 devices per license) and is never linked to any personal data beyond your license key.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Clipboard data.</strong>{" "}
                  The Clipboard History feature stores copied text locally on your device only. Clipboard contents are never transmitted to our servers or any third party.
                </p>
              </Section>

              <Section title="Information We Do Not Collect">
                <p>We do not collect:</p>
                <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
                  <li>Analytics or usage telemetry from the macOS app</li>
                  <li>Window titles, application names, or any details about what you snap</li>
                  <li>Clipboard contents (all clipboard data stays on your device)</li>
                  <li>Location data</li>
                  <li>Any information about other applications running on your Mac</li>
                </ul>
              </Section>

              <Section title="How We Use Your Information">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
                  <li>Create and manage your account</li>
                  <li>Deliver your license key and verify Pro activation in the app</li>
                  <li>Process payments via Stripe</li>
                  <li>Send transactional emails (e.g. your license key, subscription receipts)</li>
                  <li>Enforce per-device activation limits</li>
                </ul>
              </Section>

              <Section title="Data Sharing">
                <p>We share your data only with the following third-party services, which are necessary to operate the product:</p>
                <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
                  <li><strong className="text-neutral-800 dark:text-neutral-200">Stripe</strong> handles payment processing and billing. Governed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Stripe&apos;s Privacy Policy</a>.</li>
                  <li><strong className="text-neutral-800 dark:text-neutral-200">Supabase</strong> hosts the account and licence database. Data is stored in the EU (Ireland). Governed by <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Supabase&apos;s Privacy Policy</a>.</li>
                  <li><strong className="text-neutral-800 dark:text-neutral-200">Vercel</strong> hosts this website. Governed by <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Vercel&apos;s Privacy Policy</a>.</li>
                </ul>
                <p>We do not share your data with advertisers, data brokers, or any other parties.</p>
              </Section>

              <Section title="Data Retention">
                <p>
                  We retain your account and license data for as long as your account is active. If you cancel your subscription, your account and license record are retained for 90 days before deletion, in case you wish to reactivate.
                </p>
                <p>
                  You can request deletion of your account and all associated data at any time by emailing us at the address below.
                </p>
              </Section>

              <Section title="Security">
                <p>
                  Passwords are hashed and never stored in plain text. All data is transmitted over HTTPS. Access to the license database is restricted and rate-limited. Licence lookup endpoints require a valid authenticated session, so it is not possible to look up another person&apos;s licence key through this website.
                </p>
              </Section>

              <Section title="Your Rights">
                <p>
                  Depending on your location, you may have the right to access, correct, or delete the personal data we hold about you. To exercise any of these rights, please contact us at the address below. We will respond within 30 days.
                </p>
              </Section>

              <Section title="Cookies">
                <p>
                  Our website uses a session cookie solely for authentication purposes (to keep you logged in). We do not use advertising or tracking cookies.
                </p>
              </Section>

              <Section title="Children">
                <p>
                  Redock is not directed at children under 13. We do not knowingly collect personal data from children.
                </p>
              </Section>

              <Section title="Changes to This Policy">
                <p>
                  We may update this policy from time to time. We will post the updated policy on this page with a revised &ldquo;Last updated&rdquo; date. Continued use of the service after changes are posted constitutes your acceptance of the updated policy.
                </p>
              </Section>

              <Section title="Contact">
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </Section>

            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
