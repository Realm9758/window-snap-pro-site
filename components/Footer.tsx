import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Logo + copyright */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[6px] bg-accent flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-500">
            &copy; {year} Window Snap Pro. All rights reserved.
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-1 flex-wrap justify-center">
          {[
            { label: "Features", href: "/#features" },
            { label: "Changelog", href: "/changelog" },
            { label: "Download", href: "/#download" },
            { label: "Privacy Policy", href: "#" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
