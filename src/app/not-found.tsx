import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404 - Page Not Found</h1>
      <p className="text-slate-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
