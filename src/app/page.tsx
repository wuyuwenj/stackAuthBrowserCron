import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard
  redirect("/dashboard");

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Browser Automation Platform</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Automate web tasks with AI-powered browser automation using Browser Use
          </p>
          <div className="flex gap-4">
            <Link
              href="/tasks/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Create New Task
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">🤖</div>
            <h2 className="text-2xl font-semibold mb-2">AI-Powered</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Define automation tasks in natural language - no code required
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">⏰</div>
            <h2 className="text-2xl font-semibold mb-2">Schedule Tasks</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Set up cron schedules for recurring automation tasks
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-2xl font-semibold mb-2">Monitor Results</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track task runs, view logs, and analyze outputs
            </p>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <h3 className="text-2xl font-semibold mb-4">Example Use Cases</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Download Stripe invoices every month</li>
            <li>• Check Amazon order status daily</li>
            <li>• Monitor competitor prices on e-commerce sites</li>
            <li>• Scrape job postings from career sites</li>
            <li>• Automated form submissions and data entry</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
