import { useState } from "react";
import type { License } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

interface SubscriptionCardProps {
  license: License | null;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  active: { label: "Active", dot: "bg-green-500", text: "text-green-600 dark:text-green-400" },
  trialing: { label: "Trial", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  past_due: { label: "Past due", dot: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400" },
  canceled: { label: "Canceled", dot: "bg-neutral-400", text: "text-neutral-500 dark:text-neutral-400" },
  incomplete: { label: "Incomplete", dot: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400" },
  pending: { label: "Pending", dot: "bg-neutral-400", text: "text-neutral-500 dark:text-neutral-400" },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function SubscriptionCard({ license }: SubscriptionCardProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = license?.subscription_status ?? "pending";
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isPro = license?.product_tier === "pro" && license?.active;

  const handleManageSubscription = async () => {
    if (!session?.access_token) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to open portal.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card dark:shadow-card-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/60">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Subscription</h2>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              isPro
                ? "bg-accent/10 text-accent"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {isPro ? (
              <>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l2.163 4.279L15 5.763l-3.5 3.387.826 4.85L8 11.702l-4.326 2.298.826-4.85L1 5.763l4.837-.484z" />
                </svg>
                Pro
              </>
            ) : (
              "Free"
            )}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Status</span>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${config.text}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>

        {/* Plan */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Plan</span>
          <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
            {license?.product_tier ?? "Free"}
          </span>
        </div>

        {/* Renewal */}
        {license?.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {license.cancel_at_period_end ? "Ends on" : "Renews on"}
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {formatDate(license.current_period_end)}
            </span>
          </div>
        )}

        {license?.cancel_at_period_end && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl text-xs text-yellow-700 dark:text-yellow-400">
            Your subscription will cancel at the end of the billing period.
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Manage button */}
        {license?.stripe_customer_id ? (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full py-2.5 mt-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-sm font-medium rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Opening portal...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
                Manage Subscription
              </>
            )}
          </button>
        ) : (
          <a
            href="/pricing"
            className="w-full py-2.5 mt-1 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm shadow-accent/25"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 1.5z" />
            </svg>
            Upgrade to Pro
          </a>
        )}
      </div>
    </div>
  );
}
