export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_auto] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">HireBuddy</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Ready to get your task done?
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-400">
                Post a task and reach trusted local helpers instantly. Manage requests, chat with helpers, and stay in control from start to finish.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a
                href="/post-task"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                Post a Task
              </a>
              <a
                href="/become-a-helper"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                Become a Helper
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              <li><a href="/post-task" className="hover:text-white transition">Post a Task</a></li>
              <li><a href="/how-it-works" className="hover:text-white transition">How it Works</a></li>
              <li><a href="/services" className="hover:text-white transition">Services</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="space-y-3">
              <li><a href="/support" className="hover:text-white transition">Support</a></li>
              <li><a href="/refund-policy" className="hover:text-white transition">Refund Policy</a></li>
              <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="hover:text-white transition">About</a></li>
              <li><a href="/helper-agreement" className="hover:text-white transition">Helper Agreement</a></li>
              <li><a href="/terms" className="hover:text-white transition">Terms</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <p className="text-slate-400">Need help? Reach out to our support team anytime.</p>
            <a href="mailto:support@hirebuddy.com" className="hover:text-white transition">support@hirebuddy.com</a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} HireBuddy. All rights reserved.</p>
          <p>Built for trusted local help.</p>
        </div>
      </div>
    </footer>
  );
}
