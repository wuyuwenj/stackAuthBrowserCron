'use client';

import { useState } from 'react';

export interface NotificationRule {
  id: string;
  type: 'text_contains' | 'text_not_contains' | 'output_contains';
  value: string;
  enabled: boolean;
}

export interface NotificationSettingsData {
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  email: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  notificationCriteria?: string; // AI-powered natural language criteria
  customRules: NotificationRule[];
}

interface NotificationSettingsProps {
  initialSettings?: NotificationSettingsData;
  userEmail?: string;
  onChange: (settings: NotificationSettingsData) => void;
}

export function NotificationSettings({ initialSettings, userEmail, onChange }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsData>(initialSettings || {
    notifyOnSuccess: false,
    notifyOnFailure: true,
    email: userEmail || '',
    frequency: 'immediate',
    notificationCriteria: '',
    customRules: [],
  });

  const updateSettings = (updates: Partial<NotificationSettingsData>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const hasAnyNotifications = settings.notifyOnSuccess || settings.notifyOnFailure || (settings.notificationCriteria && settings.notificationCriteria.trim().length > 0);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-white dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg text-slate-900 dark:text-white">Email Notifications</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Optional</span>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Notification Email
        </label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => updateSettings({ email: e.target.value })}
          placeholder="your@email.com"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Defaults to your account email if left blank
        </p>
      </div>

      {/* Basic Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifyOnSuccess}
            onChange={(e) => updateSettings({ notifyOnSuccess: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Notify on success
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifyOnFailure}
            onChange={(e) => updateSettings({ notifyOnFailure: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Notify on failure (recommended)
          </span>
        </label>
      </div>

      {/* AI-Powered Notification Criteria */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Smart Notification Criteria
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={settings.notificationCriteria || ''}
          onChange={(e) => updateSettings({ notificationCriteria: e.target.value })}
          rows={3}
          placeholder="Example: Notify me if the plane ticket price is under $50 for any date in March"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          💡 Describe when you want to be notified in plain English. Our AI will evaluate this condition based on what it finds.
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md p-2 mt-2">
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Examples:</p>
          <ul className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 ml-4 list-disc space-y-1">
            <li>"Notify if any flight is under $50"</li>
            <li>"Notify if product is back in stock"</li>
            <li>"Notify if cheapest hotel is less than $100"</li>
            <li>"Notify if appointment available before Friday"</li>
          </ul>
        </div>
      </div>

      {/* Frequency - only show if notifications are enabled */}
      {hasAnyNotifications && settings.email && (
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Notification Frequency
          </label>
          <select
            value={settings.frequency}
            onChange={(e) => updateSettings({ frequency: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="immediate">Immediately (every run)</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly summary</option>
          </select>
        </div>
      )}

      {/* Info Box */}
      {hasAnyNotifications && settings.email && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md p-3">
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            💡 You'll receive email notifications at <strong>{settings.email}</strong> when:
          </p>
          <ul className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 ml-4 list-disc space-y-1">
            {settings.notifyOnSuccess && <li>Task completes successfully</li>}
            {settings.notifyOnFailure && <li>Task fails</li>}
            {settings.notificationCriteria && settings.notificationCriteria.trim() && (
              <li>AI evaluates: "{settings.notificationCriteria}"</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
