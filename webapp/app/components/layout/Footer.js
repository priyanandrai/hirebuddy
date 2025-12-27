export default function Footer() {
  return (
    <footer className="w-full border-t bg-gradient-to-b from-gray-50 to-white mt-16">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Top Section */}
        <div className="mb-8 flex flex-col items-center text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            HireBuddy
          </h3>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Trusted local helpers for shopping, travel, health, and everyday
            life tasks.
          </p>

          {/* CTA */}
          <div className="mt-4 flex gap-3">
            <a
              href="/post-task"
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              Post a Task
            </a>
            <a
              href="/become-helper"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Become a Helper
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 border-t" />

        {/* Links */}
        <nav
          aria-label="Footer navigation"
          className="mb-4 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-600"
        >
          <a href="/about" className="hover:text-black">
            About
          </a>
          <a href="/how-it-works" className="hover:text-black">
            How it Works
          </a>
          <a href="/services" className="hover:text-black">
            Services
          </a>
          <a href="/support" className="hover:text-black">
            Support
          </a>
          <a href="/terms" className="hover:text-black">
            Terms
          </a>
          <a href="/privacy" className="hover:text-black">
            Privacy
          </a>
        </nav>

        {/* Bottom */}
        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} HireBuddy. All rights reserved.
          </p>
          <p>
            Built with ❤️ to solve real daily problems.
          </p>
        </div>
      </div>
    </footer>
  );
}
