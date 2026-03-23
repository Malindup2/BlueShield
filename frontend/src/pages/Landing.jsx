import React from "react";
import { Link } from "react-router-dom";

const Feature = ({ title, desc, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
      </div>
    </div>
  </div>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              🛡️
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold"> BlueShield</p>
              <p className="text-xs text-slate-500">Life Below Water • SDG 14</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a className="hover:text-slate-900" href="#features">
              Features
            </a>
            <a className="hover:text-slate-900" href="#how">
              How it works
            </a>
            <a className="hover:text-slate-900" href="#contact">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:inline-flex">
              Sign in
            </Link>
            <Link to="/register" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
               Protect the ocean • Empower fishermen
            </div>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Report illegal fishing & marine hazards with{" "}
              <span className="text-blue-600">BlueShield</span>.
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              A simple web app for fishermen to quickly report suspicious
              activity, pollution, damaged nets, weather hazards, and other sea
              threats — helping protect marine life and coastal communities.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Join Now for Free
              </Link>
              <Link to="/login" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                Login to Dashboard
              </Link>
            </div>
          </div>

          {/* Right card */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-200 via-cyan-200 to-emerald-200 blur-2xl opacity-60"></div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <p className="text-sm font-semibold text-slate-800">
                  Quick Report Preview
                </p>
                <p className="text-xs text-slate-500">
                  Log an incident in under 30 seconds
                </p>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Illegal Fishing", "Hazard", "Pollution", "Rescue"].map(
                      (t) => (
                        <span
                          key={t}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {t}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Location
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                     Add GPS / area (e.g., “Kalpitiya North”)
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <div className="h-20 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Short details about the incident…
                  </div>
                </div>

                <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                  Submit Report (Requires Login)
                </button>

                <p className="text-center text-xs text-slate-500">
                  Your reports help protect{" "}
                  <span className="font-semibold text-slate-700">
                    Life Below Water
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-10 md:py-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                Core Features
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Designed for fishermen, coast guard teams, and administrators to
                collaborate on safer seas.
              </p>
            </div>
            <div className="hidden text-sm text-slate-500 md:block">
               Secure •  Fast •  Mobile-ready
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="🎣"
              title="Incident Reporting"
              desc="Report illegal fishing, hazards, or pollution with photo + GPS + notes."
            />
            <Feature
              icon="📍"
              title="Map & Hotspots"
              desc="Visualize recent reports and identify risky areas for safe navigation."
            />
            <Feature
              icon="🔐"
              title="Role-Based Access"
              desc="Fisherman, officer, and admin roles with protected routes and permissions."
            />
            <Feature
              icon="🔍"
              title="Search & Filters"
              desc="Filter by report type, date, location, status; includes pagination."
            />
            <Feature
              icon="🔔"
              title="Alerts & Updates"
              desc="Get notified when a report is reviewed, verified, or resolved."
            />
            <Feature
              icon="⛈️"
              title="Third-Party Integration"
              desc="Weather/sea condition API to warn about storms and dangerous zones."
            />
          </div>
        </section>

        {/* Footer */}
        <footer
          id="contact"
          className="border-t border-slate-200 mt-10 py-10 text-sm text-slate-500"
        >
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-semibold text-slate-700">BlueShield</p>
              <p>Built for SDG 14 — Life Below Water.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a className="hover:text-slate-700" href="#">
                Privacy
              </a>
              <a className="hover:text-slate-700" href="#">
                Terms
              </a>
              <a className="hover:text-slate-700" href="#">
                Support
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
