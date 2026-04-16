"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/planner", label: "Planner", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/teams", label: "Teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-base md:text-lg font-black text-slate-900">VocalPlan</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-xs font-medium text-slate-500">{session?.user?.email}</span>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden md:inline text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b px-4 pb-4 pt-2 space-y-1 sticky top-[52px] z-20">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="border-t pt-2 mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-wider"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow bg-[#f8fafc]">
        {children}
      </main>

      <footer className="bg-white border-t py-6 md:py-8 px-4 md:px-6 text-center text-slate-400 text-sm">
        <p className="font-medium tracking-tight">VocalPlan &bull; Organize with the speed of sound</p>
        <p className="mt-1 text-xs opacity-50 uppercase tracking-widest font-bold">Powered by Gemini AI & Z.AI</p>
      </footer>
    </div>
  );
}
