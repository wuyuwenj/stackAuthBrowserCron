"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Task {
  id: string;
  name: string;
  description: string;
  targetSite: string;
  cronSchedule: string | null;
  isActive: boolean;
  _count?: { runs: number };
  runs?: Array<{ status: string }>;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTasks = tasks.filter((t) => t.isActive).length;
  const totalRuns = tasks.reduce((sum, t) => sum + (t._count?.runs || 0), 0);
  const successfulRuns = tasks.reduce(
    (sum, t) => sum + (t.runs?.filter((r) => r.status === "success").length || 0),
    0
  );
  const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-[22px] sm:text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-600">Your automation tasks at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            + Create Task
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-slate-600">Active Tasks</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{activeTasks}</p>
            </div>
            <span className="h-9 w-9 rounded-md bg-green-50 text-green-700 flex items-center justify-center ring-1 ring-green-200">
              ✓
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-slate-600">Total Runs</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{totalRuns}</p>
            </div>
            <span className="h-9 w-9 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center ring-1 ring-indigo-200">
              ⟳
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-slate-600">Success Rate</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{successRate}%</p>
            </div>
            <span className="h-9 w-9 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center ring-1 ring-sky-200">
              ↗
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-slate-600">All Tasks</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{tasks.length}</p>
            </div>
            <span className="h-9 w-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center ring-1 ring-amber-200">
              📋
            </span>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-[15px] font-medium tracking-tight text-slate-900">
            All Automation Tasks
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-3 py-2 text-[13px] rounded-md border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-b border-slate-200">
                <th className="text-left font-medium px-4 py-3">Task Name</th>
                <th className="text-left font-medium px-4 py-3">Cron Schedule</th>
                <th className="text-left font-medium px-4 py-3">Target Site</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {searchQuery ? "No tasks match your search" : "No tasks yet. Create one to get started!"}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60 cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/tasks/${task.id}`} className="block">
                        <div>
                          <p className="font-medium text-slate-900">{task.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {task.cronSchedule || <span className="text-slate-400">Manual</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="max-w-[200px] truncate block" title={task.targetSite}>
                        {task.targetSite}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-2 py-0.5 ring-1 ${
                          task.isActive
                            ? "text-green-700 bg-green-50 ring-green-200"
                            : "text-slate-700 bg-slate-50 ring-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            task.isActive ? "bg-green-600" : "bg-slate-500"
                          }`}
                        ></span>
                        {task.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{task._count?.runs || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[13px] text-slate-600">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
      </div>
    </main>
  );
}
