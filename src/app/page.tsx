"use client";

import { Sparkles, ArrowRight, PlayCircle, ChevronDown, Bot, Terminal, ListChecks, Braces, AlertTriangle, Timer, ShoppingBag, LayoutDashboard, Search, ClipboardCopy, CalendarClock, Rocket, Settings, Brain, Globe, AlarmClock, Receipt, Lightbulb, Beaker, Monitor, History, FilePlus, Check, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";

export default function Index() {
  const [isHeadlinesOpen, setIsHeadlinesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-24">
        {/* Hero Section */}
        <section className="pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="gap-2 py-2 px-3">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-xs">New: Schedule AI agents to browse the web for you</span>
              </Badge>

              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                Automate any website. No code required.
              </h1>

              <p className="text-lg text-slate-600 max-w-xl">
                Create tasks using plain English, schedule them with cron, and let AI browse, extract data, and return structured results — automatically.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Start Automating <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="gap-2">
                    <PlayCircle className="h-4 w-4" />
                    View Demo
                  </Button>
                </Link>
              </div>

              <Card className="mt-6">
                <button
                  onClick={() => setIsHeadlinesOpen(!isHeadlinesOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-slate-50 transition-colors rounded-lg"
                >
                  <span>Other headline options</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isHeadlinesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isHeadlinesOpen && (
                  <CardContent className="pt-0 pb-4 space-y-2 text-sm text-slate-600">
                    <p>• Your AI-powered web assistant — running 24/7.</p>
                    <p>• Turn natural language into scheduled browser automation.</p>
                    <p>• AI agents that browse the web for you, on autopilot.</p>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Hero Visual */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="rounded-md border bg-white px-3 py-1.5 text-xs text-slate-600">
                    https://app.automations.dev/tasks/new
                  </div>
                </div>
                <Settings className="h-4 w-4 text-slate-400" />
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bot className="h-4 w-4" />
                      AI Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md bg-slate-50 p-3 text-xs">
                      "Check the cheapest SFO → YVR flights every morning at 9AM."
                    </div>
                    <div className="rounded-md bg-slate-900 text-slate-100 p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Terminal className="h-3.5 w-3.5 text-green-400" />
                        <span>Agent</span>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap text-slate-300">
• Navigating to google.com/flights{'\n'}• Searching SFO → YVR, flexible dates{'\n'}• Extracting cheapest fare, airline, and date{'\n'}• Scheduling daily at 09:00
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ListChecks className="h-4 w-4" />
                        Scheduled Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        { name: "Flight Tracker", status: "Active", color: "success" },
                        { name: "Product Availability", status: "Active", color: "success" },
                        { name: "Dashboard Scraper", status: "Running", color: "warning" },
                      ].map((task) => (
                        <div key={task.name} className="flex items-center justify-between rounded-md border p-2">
                          <span className="font-medium">{task.name}</span>
                          <Badge variant={task.color === "success" ? "default" : "secondary"} className="gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${task.color === "success" ? "bg-green-600" : "bg-yellow-600"}`} />
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Braces className="h-4 w-4" />
                        Run History (JSON)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-slate-50">
                      <pre className="text-xs overflow-x-auto">
{`{
  "status": "success",
  "task": "Flight Tracker",
  "cheapestFare": 182.50,
  "date": "2025-03-14",
  "airline": "WestJet",
  "checkedAt": "2025-03-13T09:00:21Z"
}`}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Problem Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-3xl font-semibold tracking-tight">Stop doing repetitive web tasks manually.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Timer, text: "Checking flight prices every day" },
              { icon: ShoppingBag, text: "Tracking product stock or price drops" },
              { icon: LayoutDashboard, text: "Monitoring dashboards with no API" },
              { icon: Search, text: "Searching competitors' sites for updates" },
              { icon: ClipboardCopy, text: "Copy/pasting data out of websites" },
              { icon: CalendarClock, text: "Checking appointment openings" },
            ].map((item, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-slate-600 flex-shrink-0" />
                  <span className="text-sm">{item.text}</span>
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-6 bg-yellow-50 border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              These tasks eat hours of your week — and they shouldn't.
            </p>
          </Card>
        </section>

        {/* Solution Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Rocket className="h-5 w-5 text-indigo-600" />
            <h2 className="text-3xl font-semibold tracking-tight">Your AI web assistant that runs on a schedule.</h2>
          </div>
          <Card className="p-6 space-y-4 text-base">
            <p>Describe what you want ("check flight prices every morning"), choose a website to start from, and optionally set a cron schedule.</p>
            <p>Our platform uses Browser Use Cloud + AI to automate the browser, extract structured results, and save run history.</p>
            <p className="font-semibold">No code. No scripts. No setup.</p>
          </Card>
        </section>

        {/* Key Features */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-slate-600" />
            <h2 className="text-3xl font-semibold tracking-tight">Key Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Natural Language Tasks", desc: "Write what you want — the AI understands and acts." },
              { icon: Globe, title: "Real Browser Automation", desc: "Powered by Browser Use Cloud (Chromium + AI navigation)." },
              { icon: AlarmClock, title: "Cron Scheduling", desc: "Run tasks every minute, hour, day, or custom intervals." },
              { icon: Receipt, title: "Full Run History", desc: "Status, logs, duration, clean results." },
            ].map((feature, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5 text-slate-600" />
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Create a task", desc: "Describe what you want in plain English and supply the starting URL." },
              { step: "2", title: "Schedule it (optional)", desc: "Use cron syntax to run every minute/hour/day." },
              { step: "3", title: "Get structured results", desc: "AI extracts clean JSON results, stored in your dashboard." },
            ].map((item) => (
              <Card key={item.step} className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-md bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Example Automations */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Beaker className="h-5 w-5 text-slate-600" />
            <h2 className="text-3xl font-semibold tracking-tight">Real-world use cases</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Flight Price Tracker */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    ✈️
                  </div>
                  <div>
                    <h3 className="font-semibold">Flight Price Tracker</h3>
                    <p className="text-xs text-slate-600">Travel & Booking</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Task Description:</p>
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    "Check Google Flights for the cheapest SFO → YVR flights every morning at 9 AM"
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Schedule:</p>
                  <Badge variant="outline" className="font-mono">0 9 * * *</Badge>
                  <span className="text-xs text-slate-600 ml-2">(Daily at 9:00 AM)</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Example Output:</p>
                  <div className="rounded-md bg-slate-900 p-3">
                    <pre className="text-xs text-slate-100 overflow-x-auto">
{`{
  "cheapestFare": 182.50,
  "airline": "WestJet",
  "date": "2025-03-14",
  "departure": "6:00 AM",
  "arrival": "9:30 AM"
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Stock Monitor */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                    🛒
                  </div>
                  <div>
                    <h3 className="font-semibold">Product Stock Monitor</h3>
                    <p className="text-xs text-slate-600">E-commerce & Shopping</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Task Description:</p>
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    "Check if PlayStation 5 is in stock on Best Buy and notify me immediately"
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Schedule:</p>
                  <Badge variant="outline" className="font-mono">*/10 * * * *</Badge>
                  <span className="text-xs text-slate-600 ml-2">(Every 10 minutes)</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Example Output:</p>
                  <div className="rounded-md bg-slate-900 p-3">
                    <pre className="text-xs text-slate-100 overflow-x-auto">
{`{
  "product": "PlayStation 5",
  "inStock": true,
  "price": 499.99,
  "url": "bestbuy.com/...",
  "checkedAt": "2025-03-13T14:30:00Z"
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitor Price Monitor */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                    📊
                  </div>
                  <div>
                    <h3 className="font-semibold">Competitor Price Tracker</h3>
                    <p className="text-xs text-slate-600">Business Intelligence</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Task Description:</p>
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    "Track competitor pricing for 'wireless headphones' on Amazon every 6 hours"
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Schedule:</p>
                  <Badge variant="outline" className="font-mono">0 */6 * * *</Badge>
                  <span className="text-xs text-slate-600 ml-2">(Every 6 hours)</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Example Output:</p>
                  <div className="rounded-md bg-slate-900 p-3">
                    <pre className="text-xs text-slate-100 overflow-x-auto">
{`{
  "competitors": [
    {"brand": "Sony", "price": 299.99},
    {"brand": "Bose", "price": 349.00},
    {"brand": "Apple", "price": 549.00}
  ]
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real Estate Alerts */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                    🏠
                  </div>
                  <div>
                    <h3 className="font-semibold">Real Estate Alerts</h3>
                    <p className="text-xs text-slate-600">Property Search</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Task Description:</p>
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    "Search Craigslist SF for 2BR apartments under $2,500/month posted in last 24h"
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Schedule:</p>
                  <Badge variant="outline" className="font-mono">0 8,20 * * *</Badge>
                  <span className="text-xs text-slate-600 ml-2">(8 AM & 8 PM daily)</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Example Output:</p>
                  <div className="rounded-md bg-slate-900 p-3">
                    <pre className="text-xs text-slate-100 overflow-x-auto">
{`{
  "newListings": 3,
  "apartments": [
    {
      "price": 2400,
      "bedrooms": 2,
      "location": "Mission District"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 bg-indigo-50 border-indigo-200 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold mb-1">Ready to automate your workflows?</p>
                <p className="text-sm text-slate-600">Get started for free - no credit card required</p>
              </div>
              <Link href="/handler/sign-in">
                <Button size="lg" className="gap-2">
                  Start Automating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Preview Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="h-5 w-5 text-slate-600" />
            <h2 className="text-3xl font-semibold tracking-tight">Preview</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Task List, Task Detail with run history, Result JSON viewer, and Create Task — these visuals drastically improve conversion.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ListChecks className="h-4 w-4" />
                  Task List
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Price Tracker", status: "Active", color: "success" },
                  { name: "Newsletter Scraper", status: "Inactive", color: "muted" },
                  { name: "SEO Auditor", status: "Running", color: "warning" },
                ].map((task) => (
                  <div key={task.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{task.name}</span>
                    <Badge variant={task.color === "success" ? "default" : task.color === "warning" ? "secondary" : "outline"} className="gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${task.color === "success" ? "bg-green-600" : task.color === "warning" ? "bg-yellow-600" : "bg-slate-500"}`} />
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4" />
                  Run History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="gap-1.5 bg-green-100 text-green-800 border-green-200">
                    <Check className="h-3 w-3" /> Success
                  </Badge>
                  <span className="text-slate-600">Today 14:20 • 21s</span>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <pre className="text-xs overflow-x-auto">
{`{
  "product": "PS5",
  "inStock": false,
  "checkedAt": "2025-03-13T10:00:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FilePlus className="h-4 w-4" />
                  Create Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="text"
                  placeholder="Task name"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="url"
                  placeholder="https://start.url"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="*/10 * * * * (optional)"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-3">
                  <Link href="/dashboard">
                    <Button size="sm">Submit</Button>
                  </Link>
                  <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                    Learn more
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t pt-12 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <a href="#about" className="text-slate-600 hover:text-slate-900">About</a>
            <a href="#docs" className="text-slate-600 hover:text-slate-900">Docs</a>
            <a href="https://github.com" className="text-slate-600 hover:text-slate-900" target="_blank" rel="noreferrer">GitHub</a>
            <a href="#privacy" className="text-slate-600 hover:text-slate-900">Privacy Policy</a>
            <a href="#terms" className="text-slate-600 hover:text-slate-900">Terms</a>
            <a href="mailto:hello@example.com" className="text-slate-600 hover:text-slate-900">Contact</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-600">Built with Next.js + Supabase + Browser Use Cloud</p>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start Free
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
