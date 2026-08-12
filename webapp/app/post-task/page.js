import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";


export default function PostTaskPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <section className="space-y-6">
              <div className="inline-flex rounded-full bg-green-700/10 px-4 py-1 text-sm font-semibold text-green-100 ring-1 ring-green-500/20">
                Quick task posting
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Post a Task in minutes
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Describe the work you need help with, set your budget, and get matched with reliable helpers nearby. HireBuddy makes it easy to post, track, and complete your task quickly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Trusted helpers</p>
                  <p className="mt-3 text-base leading-7 text-slate-200">Connect with verified local helpers who can get the job done.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Secure booking</p>
                  <p className="mt-3 text-base leading-7 text-slate-200">Pay safely and manage your task from the same dashboard.</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/95 p-8 shadow-2xl shadow-slate-950/20 text-slate-900 backdrop-blur-xl">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">
                  Start your request
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  Tell us about your task
                </h2>
              </div>

              <form className="space-y-5">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Task title</span>
                  <input
                    placeholder="Example: Clean my apartment"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Describe your task</span>
                  <textarea
                    placeholder="Provide details that help helpers understand the work"
                    className="mt-2 min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Location / Pin Code</span>
                    <input
                      placeholder="City or postal code"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Budget (₹)</span>
                    <input
                      placeholder="Enter your budget"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <button className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
                  Post Task
                </button>

                <p className="text-center text-sm text-slate-500">
                  Need help deciding? Our helpers are ready to guide you through the process.
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
