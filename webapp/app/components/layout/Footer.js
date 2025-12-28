export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 mt-20">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Brand + CTA */}
        <div className="mb-12 flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold text-white">
            HireBuddy
          </h3>

          <p className="mt-3 max-w-md text-sm text-gray-400">
            Trusted local helpers for shopping, travel, health,
            and everyday life tasks.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="/post-task"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Post a Task
            </a>

            <a
              href="/become-helper"
              className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Become a Helper
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mb-8" />

        {/* Navigation */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-gray-400"
        >
          {[
            ["About", "/about"],
            ["How it Works", "/how-it-works"],
            ["Services", "/services"],
            ["Support", "/support"],
            ["Refund & Cancellation", "/refund-policy"],
            ["Helper Agreement", "/helper-agreement"],
            ["Terms", "/terms"],
            ["Privacy", "/privacy"],
          ]
            .map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="hover:text-white transition"
              >
                {label}
              </a>
            ))}
        </nav>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center gap-2 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} HireBuddy. All rights reserved.
          </p>
          <p>
            Built with care to solve real everyday problems.
          </p>
        </div>

      </div>
    </footer>
  );
}
