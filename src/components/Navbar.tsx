"use client";

import Link from "next/link";
import { UserButton } from "@stackframe/stack";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-xl font-semibold hover:opacity-80 transition"
            >
              BrowserCron
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  isActive("/dashboard")
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/tasks"
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  isActive("/tasks")
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                Tasks
              </Link>
              <Link
                href="/pricing"
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  isActive("/pricing")
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right side - Create Task button and UserButton */}
          <div className="flex items-center gap-3">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              + Create Task
            </Link>
            <UserButton
              showUserInfo={true}
              extraItems={[{
                text: 'Upgrade Plan',
                icon: <span>⚡</span>,
                onClick: async () => {
                  window.location.href = '/pricing';
                }
              }]}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
