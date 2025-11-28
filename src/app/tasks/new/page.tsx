"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilePlus2, BookOpenText, Sparkles, Save, Globe, FileText, X, AlertCircle } from "lucide-react";
import CronSchedulePicker from "@/components/CronSchedulePicker";
import { NotificationSettings, NotificationSettingsData } from "@/components/NotificationSettings";
import { Navbar } from "@/components/Navbar";

interface FieldErrors {
  name?: string;
  description?: string;
  targetSite?: string;
  cronSchedule?: string;
  notificationSettings?: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetSite: "https://google.com",
    cronSchedule: "",
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    // Fetch current user
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        setUserId(data.userId);
        setUserEmail(data.email);
      })
      .catch((error) => console.error('Failed to fetch user:', error));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId,
          cronSchedule: formData.cronSchedule || undefined,
          notificationSettings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.details && Array.isArray(data.details)) {
          const errors: FieldErrors = {};
          data.details.forEach((detail: any) => {
            const field = detail.path?.[0];
            if (field) {
              errors[field as keyof FieldErrors] = detail.message;
            }
          });
          setFieldErrors(errors);
          setError("Please fix the errors below");
        } else {
          setError(data.error || data.message || "Failed to create task");
        }
        setLoading(false);
        return;
      }

      router.push(`/tasks/${data.task.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create task");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FilePlus2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Task</h1>
              <p className="text-muted-foreground mt-1">
                Define your automation with natural language
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-destructive hover:text-destructive/80 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="border-b bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Task Details</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Task Name */}
                <div className="space-y-2">
                  <label htmlFor="taskName" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Task Name
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="taskName"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) {
                        setFieldErrors({ ...fieldErrors, name: undefined });
                      }
                    }}
                    className={`w-full border bg-background rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                      fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                    placeholder="e.g., Flight Price Tracker or Product Stock Monitor"
                  />
                  {fieldErrors.name ? (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.name}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Give your task a clear, descriptive name
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="taskDesc" className="text-sm font-medium flex items-center gap-2">
                    <BookOpenText className="h-4 w-4 text-muted-foreground" />
                    Natural Language Description
                    <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="taskDesc"
                    required
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (fieldErrors.description) {
                        setFieldErrors({ ...fieldErrors, description: undefined });
                      }
                    }}
                    rows={5}
                    className={`w-full border bg-background rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none ${
                      fieldErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                    placeholder="Describe what you want the browser to do in plain English&#10;&#10;Example: Search Google Flights for the cheapest flights from SFO to YVR, extract the lowest fare, airline, and departure date"
                  />
                  {fieldErrors.description ? (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Explain your automation goal in detail. Be specific about the steps you want.
                    </p>
                  )}
                </div>

                {/* Target URL */}
                <div className="space-y-2">
                  <label htmlFor="taskUrl" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Starting URL
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    id="taskUrl"
                    type="url"
                    value={formData.targetSite}
                    onChange={(e) => {
                      setFormData({ ...formData, targetSite: e.target.value });
                      if (fieldErrors.targetSite) {
                        setFieldErrors({ ...fieldErrors, targetSite: undefined });
                      }
                    }}
                    className={`w-full border bg-background rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${
                      fieldErrors.targetSite ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                    placeholder="https://www.google.com/flights"
                  />
                  {fieldErrors.targetSite ? (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.targetSite}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Use specific URLs for efficiency. For example, if tracking flights, use https://www.google.com/flights or if checking product availability, use the exact product page URL.
                    </p>
                  )}
                </div>

                {/* Schedule Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium block mb-3">
                    Schedule <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <CronSchedulePicker
                    value={formData.cronSchedule}
                    onChange={(cronExpression) => {
                      setFormData({ ...formData, cronSchedule: cronExpression });
                      if (fieldErrors.cronSchedule) {
                        setFieldErrors({ ...fieldErrors, cronSchedule: undefined });
                      }
                    }}
                  />
                  {fieldErrors.cronSchedule && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.cronSchedule}
                    </p>
                  )}
                </div>

                {/* Notification Settings */}
                <div className="space-y-2">
                  <NotificationSettings
                    userEmail={userEmail}
                    onChange={(settings) => {
                      setNotificationSettings(settings);
                      if (fieldErrors.notificationSettings) {
                        setFieldErrors({ ...fieldErrors, notificationSettings: undefined });
                      }
                    }}
                  />
                  {fieldErrors.notificationSettings && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.notificationSettings}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Link href="/tasks">
                    <button
                      type="button"
                      className="px-5 py-2.5 border rounded-lg hover:bg-muted transition font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Task
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Tips Card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="border-b bg-muted/30 px-5 py-3">
                <div className="flex items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Best Practices</h3>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Use natural language to describe your goals. Our AI handles the technical details.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Set a schedule to automate, or run it manually whenever needed.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Keep task names concise and specific for easy identification.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Include all necessary steps in your description for best results.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Examples Card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="border-b bg-muted/30 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Example Tasks</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Flight Price Tracker</p>
                    <p className="text-xs text-muted-foreground">
                      Search Google Flights for cheapest SFO to YVR flights daily at 9 AM
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Product Stock Monitor</p>
                    <p className="text-xs text-muted-foreground">
                      Check if PlayStation 5 is in stock on Best Buy every 10 minutes
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Real Estate Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Search Craigslist for 2BR apartments under $2,500 twice daily
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Competitor Prices</p>
                    <p className="text-xs text-muted-foreground">
                      Track wireless headphones pricing on Amazon every 6 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
