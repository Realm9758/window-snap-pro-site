"use client";

import { useState } from "react";
import type { License } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import SubscriptionCard from "@/components/SubscriptionCard";

interface ProfileSettingsProps {
  license: License | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-all duration-150"
    >
      {copied ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function ProfileSettings({ license }: ProfileSettingsProps) {
  const { user, signOut } = useAuth();

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-glow">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account Info */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card dark:shadow-card-dark overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/60">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Account
            </h2>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Email
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {user?.email}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Member since
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* License */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card dark:shadow-card-dark overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/60">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              License
            </h2>
          </div>

          <div className="px-6 py-5 space-y-4">
            {license?.license_key ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                    License key
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-sm font-mono font-medium text-neutral-900 dark:text-white tracking-wider truncate">
                      {license.license_key}
                    </code>

                    <CopyButton text={license.license_key} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Activations
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {license.activation_count} / {license.max_activations} devices
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  No license found for this account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription */}
        <SubscriptionCard license={license} />

        {/* Sign out */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card dark:shadow-card-dark overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Sign out
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Sign out of your account on this device
                </p>
              </div>

              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-150"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}