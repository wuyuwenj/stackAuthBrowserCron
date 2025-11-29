"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CronSchedulePicker from "@/components/CronSchedulePicker";
import { Navbar } from "@/components/Navbar";

interface TaskRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  outputJson: any;
  errorMsg: string | null;
  logs: string | null;
}

interface Task {
  id: string;
  name: string;
  description: string;
  targetSite: string;
  cronSchedule: string | null;
  nextRunAt: string | null;
  isActive: boolean;
  createdAt: string;
  runs: TaskRun[];
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "runs" | "settings">("overview");
  const [streamingLogs, setStreamingLogs] = useState<string[]>([]);
  const [showStreamingLogs, setShowStreamingLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    targetSite: "",
    cronSchedule: "",
    description: "",
  });
  const [notificationForm, setNotificationForm] = useState({
    enabled: false,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    email: "",
    frequency: "immediate" as "immediate" | "daily" | "weekly",
    notificationCriteria: "",
  });

  const fetchTask = () => {
    fetch(`/api/tasks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data.task);
        setEditForm({
          name: data.task.name,
          targetSite: data.task.targetSite,
          cronSchedule: data.task.cronSchedule || "",
          description: data.task.description,
        });
        // Set notification form data
        if (data.task.notificationSettings) {
          setNotificationForm({
            enabled: true,
            notifyOnSuccess: data.task.notificationSettings.notifyOnSuccess,
            notifyOnFailure: data.task.notificationSettings.notifyOnFailure,
            email: data.task.notificationSettings.email,
            frequency: data.task.notificationSettings.frequency,
            notificationCriteria: data.task.notificationSettings.notificationCriteria || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingLogs]);

  const handleRunTask = async () => {
    setRunning(true);
    setStreamingLogs([]);
    setShowStreamingLogs(true);

    try {
      const response = await fetch(`/api/tasks/${id}/run-stream`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to run task");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream closed
          console.log('Stream closed');
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                setStreamingLogs(prev => [...prev, `🚀 ${data.message}`]);
              } else if (data.type === 'step') {
                if (data.step.thought) {
                  setStreamingLogs(prev => [...prev, `💭 ${data.step.thought}`]);
                }
                if (data.step.action) {
                  const actionStr = typeof data.step.action === 'string'
                    ? data.step.action
                    : JSON.stringify(data.step.action);
                  setStreamingLogs(prev => [...prev, `⚡ ${actionStr}`]);
                }
                if (data.step.output) {
                  setStreamingLogs(prev => [...prev, `📋 ${data.step.output}`]);
                }
                if (data.step.raw) {
                  setStreamingLogs(prev => [...prev, `📝 ${data.step.raw}`]);
                }
              } else if (data.type === 'complete') {
                setStreamingLogs(prev => [...prev, `✅ Task completed in ${(data.duration / 1000).toFixed(1)}s`]);
                setTimeout(fetchTask, 1000);
              } else if (data.type === 'error') {
                setStreamingLogs(prev => [...prev, `❌ Error: ${data.error}`]);
                setTimeout(fetchTask, 1000);
              }
            } catch (e) {
              console.error('Failed to parse SSE message:', e);
            }
          }
        }
      }

      // Stream finished, always refresh the task
      console.log('Refreshing task after stream completion');
      await fetchTask();
    } catch (error) {
      console.error('Stream error:', error);
      setStreamingLogs(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      // Always set running to false when stream ends
      setRunning(false);
    }
  };

  const handleToggleActive = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !task.isActive,
        }),
      });

      if (response.ok) {
        fetchTask();
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          targetSite: editForm.targetSite,
          cronSchedule: editForm.cronSchedule || null,
          description: editForm.description,
        }),
      });

      if (response.ok) {
        fetchTask();
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      if (!notificationForm.enabled) {
        // Delete notification settings
        await fetch(`/api/tasks/${id}/notifications`, {
          method: "DELETE",
        });
        fetchTask();
        return;
      }

      // Update or create notification settings
      const response = await fetch(`/api/tasks/${id}/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifyOnSuccess: notificationForm.notifyOnSuccess,
          notifyOnFailure: notificationForm.notifyOnFailure,
          email: notificationForm.email,
          frequency: notificationForm.frequency,
          notificationCriteria: notificationForm.notificationCriteria || undefined,
          customRules: [],
        }),
      });

      if (response.ok) {
        fetchTask();
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const getNextRunTime = () => {
    if (!task?.nextRunAt || !task?.isActive) return "Not scheduled";
    return new Date(task.nextRunAt).toLocaleString();
  };

  const getLastRunTime = () => {
    if (!task?.runs || task.runs.length === 0) return "Never";
    return new Date(task.runs[0].startedAt).toLocaleString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <p>Loading task...</p>
        </main>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <p>Task not found</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </main>
      </>
    );
  }

  const latestRun = task.runs && task.runs.length > 0 ? task.runs[0] : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {task.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {task.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5 ring-1 ${
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTask}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              {running ? "Running..." : "▶ Run Now"}
            </button>
            <button
              onClick={handleToggleActive}
              className="inline-flex items-center gap-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3.5 py-2 shadow-sm border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {task.isActive ? "⏸ Deactivate" : "▶ Activate"}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-md bg-white hover:bg-red-50 text-red-600 text-sm font-medium px-3.5 py-2 shadow-sm border border-slate-300 hover:border-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              🗑 Delete
            </button>
          </div>
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-600 mb-1">Cron Schedule</p>
            <p className="text-sm font-medium text-slate-900">
              {task.cronSchedule || "Manual"}
            </p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-600 mb-1">Last Run</p>
            <p className="text-sm font-medium text-slate-900">{getLastRunTime()}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-600 mb-1">Next Run</p>
            <p className="text-sm font-medium text-slate-900">{getNextRunTime()}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-600 mb-1">Total Runs</p>
            <p className="text-sm font-medium text-slate-900">{task.runs.length}</p>
          </div>
        </div>
      </div>

      {/* Streaming Logs */}
      {showStreamingLogs && (
        <div className="mb-6">
          <div className="rounded-lg bg-slate-900 border border-slate-700 shadow-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {running ? "🔴 Live Progress" : "📋 Task Log"}
                </span>
                {running && (
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </div>
              <button
                onClick={() => setShowStreamingLogs(false)}
                className="text-slate-400 hover:text-white transition text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {streamingLogs.length === 0 ? (
                <p className="text-slate-400">Waiting for updates...</p>
              ) : (
                <>
                  {streamingLogs.map((log, index) => (
                    <div key={index} className="text-slate-100 py-1">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("runs")}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === "runs"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Runs
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === "settings"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Run */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Latest Run</h2>
              {latestRun ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1.5 ${
                        latestRun.status === "success"
                          ? "bg-green-100 text-green-800"
                          : latestRun.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {latestRun.status === "success" && "✓"}
                      {latestRun.status === "failed" && "✗"}
                      {latestRun.status === "running" && "⟳"}
                      {latestRun.status.charAt(0).toUpperCase() + latestRun.status.slice(1)}
                    </span>
                    <span className="text-sm text-slate-600">
                      {new Date(latestRun.startedAt).toLocaleString()}
                    </span>
                    {latestRun.finishedAt && (
                      <span className="text-sm text-slate-600">
                        Duration:{" "}
                        {Math.round(
                          (new Date(latestRun.finishedAt).getTime() -
                            new Date(latestRun.startedAt).getTime()) /
                            1000
                        )}
                        s
                      </span>
                    )}
                  </div>

                  {latestRun.errorMsg && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-semibold text-red-800">Error:</p>
                      <p className="text-sm text-red-800">{latestRun.errorMsg}</p>
                    </div>
                  )}

                  {latestRun.outputJson && (() => {
                    // Parse outputJson if it's a string
                    const output = typeof latestRun.outputJson === 'string'
                      ? JSON.parse(latestRun.outputJson)
                      : latestRun.outputJson;
                    const results = output?.result || [];

                    if (!Array.isArray(results) || results.length === 0) return null;

                    return (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          View Result ({results.length} {results.length === 1 ? 'item' : 'items'})
                        </summary>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                          <ul className="space-y-2">
                            {results.map((item: string, idx: number) => (
                              <li key={idx} className="text-slate-800 text-sm">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    );
                  })()}

                  {latestRun.logs && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900 font-medium">
                        View Logs
                      </summary>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg mt-2 text-xs overflow-x-auto">
                        {latestRun.logs}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">
                  No runs yet. Click "Run Now" to execute this task.
                </p>
              )}
            </div>
          </div>

          {/* Task Info */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Task Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Description</p>
                  <p className="text-sm text-slate-900">{task.description}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Target Site</p>
                  <p className="text-sm text-slate-900 break-all">{task.targetSite}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Created</p>
                  <p className="text-sm text-slate-900">
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "runs" && (
        <div className="rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Run History</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {task.runs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">
                No runs yet. Click "Run Now" to execute this task.
              </div>
            ) : (
              task.runs.map((run) => (
                <div key={run.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1.5 ${
                          run.status === "success"
                            ? "bg-green-100 text-green-800"
                            : run.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {run.status === "success" && "✓"}
                        {run.status === "failed" && "✗"}
                        {run.status === "running" && "⟳"}
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(run.startedAt).toLocaleString()}
                      </span>
                    </div>
                    {run.finishedAt && (
                      <span className="text-sm text-slate-600">
                        Duration:{" "}
                        {Math.round(
                          (new Date(run.finishedAt).getTime() -
                            new Date(run.startedAt).getTime()) /
                            1000
                        )}
                        s
                      </span>
                    )}
                  </div>

                  {run.errorMsg && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                      <p className="text-sm font-semibold text-red-800">Error:</p>
                      <p className="text-sm text-red-800">{run.errorMsg}</p>
                    </div>
                  )}

                  {run.outputJson && (() => {
                    // Parse outputJson if it's a string
                    const output = typeof run.outputJson === 'string'
                      ? JSON.parse(run.outputJson)
                      : run.outputJson;
                    const results = output?.result || [];

                    if (!Array.isArray(results) || results.length === 0) return null;

                    return (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          View Result ({results.length} {results.length === 1 ? 'item' : 'items'})
                        </summary>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                          <ul className="space-y-2">
                            {results.map((item: string, idx: number) => (
                              <li key={idx} className="text-slate-800 text-sm">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    );
                  })()}

                  {run.logs && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900 font-medium">
                        View Logs
                      </summary>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg mt-2 text-xs overflow-x-auto">
                        {run.logs}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Task Settings */}
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Task Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target URL
                </label>
                <input
                  type="text"
                  value={editForm.targetSite}
                  onChange={(e) => setEditForm({ ...editForm, targetSite: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Schedule <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <CronSchedulePicker
                  value={editForm.cronSchedule}
                  onChange={(cronExpression) =>
                    setEditForm({ ...editForm, cronSchedule: cronExpression })
                  }
                />
              </div>
              <div className="pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notification Settings</h2>
            <div className="space-y-4">
              {/* Enable notifications toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={notificationForm.enabled}
                  onChange={(e) => setNotificationForm({ ...notificationForm, enabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <label htmlFor="enableNotifications" className="ml-2 block text-sm font-medium text-slate-700">
                  Enable email notifications
                </label>
              </div>

              {notificationForm.enabled && (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={notificationForm.email}
                      onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notification Frequency
                    </label>
                    <select
                      value={notificationForm.frequency}
                      onChange={(e) => setNotificationForm({ ...notificationForm, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </div>

                  {/* Notify on success/failure */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifySuccess"
                        checked={notificationForm.notifyOnSuccess}
                        onChange={(e) => setNotificationForm({ ...notificationForm, notifyOnSuccess: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <label htmlFor="notifySuccess" className="ml-2 block text-sm text-slate-700">
                        Notify on successful runs
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifyFailure"
                        checked={notificationForm.notifyOnFailure}
                        onChange={(e) => setNotificationForm({ ...notificationForm, notifyOnFailure: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <label htmlFor="notifyFailure" className="ml-2 block text-sm text-slate-700">
                        Notify on failed runs
                      </label>
                    </div>
                  </div>

                  {/* Smart notification criteria */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Smart Notification Criteria <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notificationForm.notificationCriteria}
                      onChange={(e) => setNotificationForm({ ...notificationForm, notificationCriteria: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Notify me if flights are under $50"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      AI will evaluate this condition and only send notifications when it's met
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4">
                <button
                  onClick={handleSaveNotificationSettings}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
